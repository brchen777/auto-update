(async () => {
    'use strict';

    require('../prepenv');
    const os = require('os');
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
    const { host, port } = config.conf.server;
    const { delayTimeout, updateTimeout } = config.conf.client;
    const initUrl = `http://${host}:${port}/init`;
    const wsUrl = `ws://${host}:${port}`;

    const __handlers = {
        __system_update: require('./handlers/update')
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
            await main();
        }
        catch (err) {
            console.error(`* ${err}`);
            process.exit();
        }
    }

    async function main() {
        // check client is initialized
        let initFlagPath = `${workingRoot}/__init`;
        if (!fs.existsSync(initFlagPath)) {
            await init();
            await run();
        }
        else {
            await run();
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
})();
