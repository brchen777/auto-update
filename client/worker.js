(async () => {
    'use strict';

    require('../prepenv');
    const net = require('net');
    const os = require('os-utils');
    const fs = require('fs-extra');
    const WebSocket = require('ws');
    const shell = require('shelljs');
    const crypto = require('crypto');
    const readline = require('readline');
    const si = require('systeminformation');
    const config = require('json-cfg').trunk;
    const { COMMAND } = require('../lib/constants');
    const { machineIdSync } = require('node-machine-id');
    const { postJson, sleep, consoleLog, consoleError } = require('../lib/misc');

    const hash = crypto.createHash('md5');
    const { bashPath, workingRoot } = config.conf.runtime;
    const { host: serverHost, port: serverPort } = config.conf.server;
    const { detectTimeout, delayTimeout, sendTimeout } = config.conf.client;
    const initUrl = `http://${serverHost}:${serverPort}/init`;
    const initFlagPath = `${workingRoot}/__init`;
    const wsUrl = `ws://${serverHost}:${serverPort}`;
    const uid = await getUID();

    const HANDLERS = {
        '__system-update': require('./handlers/update'),
        '__system-reboot': require('./handlers/reboot'),
        '__system-reset': require('./handlers/reset')
    };

    try {
        // check client is initialized
        if (!fs.existsSync(initFlagPath)) {
            await detectNetwork(serverHost, serverPort, detectTimeout, init);
            await detectNetwork(serverHost, serverPort, detectTimeout, run);
        }
        else {
            await detectNetwork(serverHost, serverPort, detectTimeout, run);
        }
    }
    catch (err) {
        consoleError(err);
        process.exit(1);
    }

    async function init() {
        consoleLog('Client init...');

        let initResolve, initReject;
        let initPromise = new Promise((resolve, reject) => {
            initResolve = resolve;
            initReject = reject;
        });
        setTimeout(configureIp, delayTimeout, initResolve, initReject);
        return initPromise;
    }

    async function run() {
        consoleLog('Client running...');

        let runReject;
        let runPromise = new Promise((resolve, reject) => { runReject = reject; });
        const ws = new WebSocket(wsUrl);
        ws
        .on('open', async () => {
            ws.send(JSON.stringify({ eventName: '__client-ws-open', args: [uid] }));
        })
        .on('message', (data) => {
            let dataParse = JSON.parse(data);
            if (Object(dataParse) !== dataParse) return;

            let { eventName, args = [] } = dataParse;
            if (eventName === '__system-update') {
                args = [ws, ...args];
            }

            let handler = HANDLERS[eventName];
            if (typeof handler !== 'function') return;

            handler(...args);
        })
        .on('close', (...args) => {
            consoleError(args);
            runReject('Connection close.');
        })
        .on('error', (e) => {
            runReject(e.message);
        });
        setTimeout(sendSysInfo, sendTimeout, ws);
        return runPromise;
    }

    // check client can connect to server
    async function detectNetwork(host, port, timeout, cb) {
        let alive = await connectionAlive(host, port);
        while (!alive) {
            consoleError('Not connected');
            await sleep(timeout);
            alive = await connectionAlive(host, port);
        }
        await cb();
    }

    async function connectionAlive(host, port) {
        let connectResolve;
        let connectPromise = new Promise((resolve) => { connectResolve = resolve; });
        let timer = setTimeout(() => {
            socket.end();
            connectResolve(false);
        }, 10000);

        let socket = net.createConnection(port, host, () => {
            clearTimeout(timer);
            socket.end();
            connectResolve(true);
        });
        socket.on('error', () => {
            clearTimeout(timer);
            connectResolve(false);
        });
        return connectPromise;
    }

    async function configureIp(resolve, reject) {
        let sysInfo = await getSysInfo();
        postJson(initUrl, sysInfo)
        .then((res) => {
            if (res.statusCode !== 200) {
                reject('Client get ip error (post error)');
                return;
            }

            let { ip } = JSON.parse(res.body);
            consoleLog(`Client get ip: "${ip}"...`);
            shell.exec(COMMAND.SET_DHCP(ip), { shell: bashPath });
            shell.exec(COMMAND.RESTART_NETWORK, { shell: bashPath });
            shell.exec(COMMAND.CREATE_INIT_FLAG(uid), { shell: bashPath });
            resolve();
        })
        .catch((e) => {
            reject(e.message);
        });
    }

    async function sendSysInfo(ws) {
        let sendResolve;
        const sendPromise = new Promise((resolve) => { sendResolve = resolve; });
        let sysInfo = await getSysInfo();
        ws.send(JSON.stringify({ eventName: '__client-send-sysInfo', args: [sysInfo] }), () => {
            consoleLog('Send sysInfo...');
            setTimeout(sendSysInfo, sendTimeout, ws);
            sendResolve();
        });
        return sendPromise;
    }

    async function getSysInfo() {
        // get cpu info
        const p1 = new Promise((resolve) => {
            os.cpuUsage((v) => {
                resolve(v);
            });
        });

        // get memory info
        const p2 = si.mem().catch((err) => {
            consoleError(err);
        });

        // get disk info
        const p3 = si.fsSize().catch((err) => {
            consoleError(err);
        });

        let [cpu, mem, disk] = await Promise.all([p1, p2, p3])
        return { uid, cpu, mem, disk };
    }

    async function getUID() {
        let readResolve;
        const readPromise = new Promise((resolve) => { readResolve = resolve; });
        if (fs.existsSync(initFlagPath)) {
            let rl = readline.createInterface({
                input: fs.createReadStream(initFlagPath)
            });
            rl.on('line', (line) => {
                readResolve(line);
            });
        }
        else {
            let machineId = machineIdSync();
            let time = Date.now();
            let hexStr = hash.update(`${machineId}-${time}`).digest('hex');
            readResolve(hexStr);
        }
        return readPromise;
    }
})();
