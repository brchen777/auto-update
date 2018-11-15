(async () => {
    'use strict';

    require('../prepenv');
    const os = require('os');
    const http = require('http');
    const fs = require('fs-extra');
    const WebSocket = require('ws');
    const shell = require('shelljs');
    const si = require('systeminformation');
    const config = require('json-cfg').trunk;
    const { COMMAND } = require('../lib/constants');
    const { machineId } = require('node-machine-id');

    const { bashPath, workingRoot } = config.conf.runtime;
    const { host, port } = config.conf.server;
    const initUrl = `http://${host}:${port}/init`;
    const wsUrl = `ws://${host}:${port}`;

    const __handlers = {
        __system_update: require('./handlers/update')
    };

    // check client is initialized
    let initFlagPath = `${workingRoot}/__init`;
    if (!fs.existsSync(initFlagPath)) {
        // wait 5 seconds for init
        // setTimeout(() => {
        init();
        // }, 5000);
    }
    else {
        run();
    }
    
    async function init() {
        console.log('* Client init...');

        let sysInfo = await getSystemInfo();
        let postData = JSON.stringify(sysInfo);
        let postOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }

        const req = http.request(initUrl, postOptions, (res) => {
            new Promise((resolve, reject) => {
                // check response status code
                (res.statusCode === 200) ? resolve(res) : reject('Mac address error');
            })
            .then((res) => {
                let data = '';
                res
                .on('data', (chunk) => {
                    data += chunk;
                })
                .on('end', () => {
                    let { ip } = JSON.parse(data);
                    console.log(`* Client get ip: "${ip}"...`);

                    shell.exec(COMMAND.SET_DHCP(ip), { shell: bashPath });
                    shell.exec(COMMAND.RESTART_NETWORK, { shell: bashPath });
                    shell.exec(COMMAND.CREATE_INIT_FLAG(ip), { shell: bashPath });
                });
            })
            .catch((err) => {
                console.error(`* Got error: ${err}`);
            });
        })
        .on('error', (e) => {
            console.error(`Got error: ${e.message}`);

            // reset if init error
            // setTimeout(() => {
            init();
            // }, 2000);
        });

        req.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
        });
          
        // write data to request body
        req.write(JSON.stringify(postData));
        req.end();
    }

    function run() {
        console.log('* Client running...');

        const ws = new WebSocket(wsUrl);
        ws.on('message', (data) => {
            let { eventName, args } = JSON.parse(data);
            let handler = __handlers[eventName] || {};
            if (handler !== undefined) {
                handler(...args);
            }
        });
    }

    async function getSystemInfo() {
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
})();
