process.on('unhandledRejection', (err) => {
    console.error(`* ${err}`);
    process.exit(1);
});

(async () => {
    'use strict';

    require('../prepenv');
    const os = require('os');
    const net = require('net');
    const fs = require('fs-extra');
    const WebSocket = require('ws');
    const shell = require('shelljs');
    const crypto = require('crypto');
    const cluster = require('cluster');
    const readline = require('readline');
    const si = require('systeminformation');
    const config = require('json-cfg').trunk;
    const { COMMAND } = require('../lib/constants');
    const { machineIdSync } = require('node-machine-id');
    const { postJson, sleep, consoleLog, consoleError } = require('../lib/misc');

    const hash = crypto.createHash('md5');
    const { bashPath, workingRoot } = config.conf.runtime;
    const { host: serverHost, port: serverPort } = config.conf.server;
    const { detectTimeout, delayTimeout, updateTimeout } = config.conf.client;
    const initUrl = `http://${serverHost}:${serverPort}/init`;
    const initFlagPath = `${workingRoot}/__init`;
    const wsUrl = `ws://${serverHost}:${serverPort}`;
    const uid = await getUID();

    const __handlers = {
        __system_update: require('./handlers/update'),
        __system_reboot: require('./handlers/reboot')
    };

    if (cluster.isMaster) {
        cluster.fork();
        cluster.on('exit', (worker, code, signal) => {
            consoleLog(`Worker ${worker.process.pid} died (${(signal || code)}), Restarting...`);
            cluster.fork();
        });
    }
    else {
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
            ws.send(JSON.stringify({ eventName: '__client-client-open', args: [uid] }));
        })
        .on('message', (data) => {
            let { eventName, args } = JSON.parse(data);
            let handler = __handlers[eventName] || {};
            if (handler !== undefined) {
                handler(...args);
            }
        })
        .on('close', () => {
            runReject('Connection close.');
        })
        .on('error', (e) => {
            runReject(e.message);
        });
        setTimeout(sendSysInfo, updateTimeout, ws);
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
                reject('System post error');
            }

            let { uid, ip } = JSON.parse(res.body);
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
        ws.send(JSON.stringify({ eventName: '__client-update-info', args: [sysInfo] }), () => {
            consoleLog('Send sysInfo...');
            setTimeout(sendSysInfo, updateTimeout, ws);
            sendResolve();
        });
        return sendPromise;
    }

    async function getSysInfo() {
        // get uid
        const p1 = Promise.resolve(uid);

        // get cpu info
        const p2 = Promise.resolve(os.cpus());

        // get memory info
        const p3 = si.mem().catch((err) => {
            consoleError(err);
        });

        // get disk info
        const p4 = si.fsSize().catch((err) => {
            consoleError(err);
        });

        return Promise.all([p1, p2, p3, p4])
        .then(([uid, cpu, mem, disk]) => {
            return { uid, cpu, mem, disk };
        });
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
