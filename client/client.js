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
    const cluster = require('cluster');
    const si = require('systeminformation');
    const config = require('json-cfg').trunk;
    const { postJson } = require('../lib/misc');
    const { COMMAND } = require('../lib/constants');
    const { machineId } = require('node-machine-id');

    const { bashPath, workingRoot } = config.conf.runtime;
    const { host: serverHost, port: serverPort } = config.conf.server;
    const { detectTimeout, delayTimeout, updateTimeout } = config.conf.client;
    const initUrl = `http://${serverHost}:${serverPort}/init`;
    const wsUrl = `ws://${serverHost}:${serverPort}`;

    const __handlers = {
        __system_update: require('./handlers/update'),
        __system_reboot: require('./handlers/reboot')
    };

    if (cluster.isMaster) {
        cluster.fork();
        cluster.on('exit', (worker, code, signal) => {
            console.log(`* Worker ${worker.process.pid} died (${(signal || code)}). restarting...`);
            cluster.fork();
        });
    }
    else {
        try {
            // check client is initialized
            let initFlagPath = `${workingRoot}/__init`;
            if (!fs.existsSync(initFlagPath)) {
                await detectNetwork(serverHost, serverPort, detectTimeout, init);
                await detectNetwork(serverHost, serverPort, detectTimeout, run);
            }
            else {
                await detectNetwork(serverHost, serverPort, detectTimeout, run);
            }
        }
        catch (err) {
            console.error(`* ${err} at ${new Date().toLocaleString()}.`);
            process.exit(1);
        }
    }

    async function init() {
        console.log('* Client init...');

        let initResolve, initReject;
        let initPromise = new Promise((resolve, reject) => {
            initResolve = resolve;
            initReject = reject;
        });
        setTimeout(configureIp, delayTimeout, initResolve, initReject);
        return initPromise;
    }

    async function run() {
        console.log('* Client running...');

        let runReject;
        let runPromise = new Promise((resolve, reject) => { runReject = reject; });
        const ws = new WebSocket(wsUrl);
        ws
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
            console.error(`* Not connected at ${new Date().toLocaleString()}.`);
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

            let { ip } = JSON.parse(res.body);
            console.log(`* Client get ip: "${ip}"...`);
            shell.exec(COMMAND.SET_DHCP(ip), { shell: bashPath });
            shell.exec(COMMAND.RESTART_NETWORK, { shell: bashPath });
            shell.exec(COMMAND.CREATE_INIT_FLAG(ip), { shell: bashPath });
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
            console.log(`* Send sysInfo at ${new Date().toLocaleString()}`);
            setTimeout(sendSysInfo, updateTimeout, ws);
            sendResolve();
        });
        return sendPromise;
    }

    async function getSysInfo() {
        // get machine id
        const p1 = machineId({ original: true });

        // get cpu info
        const p2 = Promise.resolve(os.cpus());

        // get memory info
        const p3 = si.mem().catch((error) => {
            console.error(error);
        });

        // get disk info
        const p4 = si.fsSize().catch((error) => {
            console.error(error);
        });

        return Promise.all([p1, p2, p3, p4])
        .then(([machineId, cpu, mem, disk]) => {
            return { machineId, cpu, mem, disk };
        });
    }

    function sleep(ms){
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
})();
