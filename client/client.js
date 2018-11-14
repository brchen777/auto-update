(() => {
    'use strict';

    require('../prepenv');
    const config = require('json-cfg').trunk;
    const fs = require('fs-extra');
    const http = require('http');
    const WebSocket = require('ws');
    const querystring = require('querystring');
    const shell = require('shelljs');
    const { COMMAND } = require('../lib/constants');
    const si = require('systeminformation');

    const { workingRoot } = config.conf.runtime;
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
        setTimeout(() => {
            init();
        }, 5000);
    }
    else {
        run();
    }
    
    async function init() {
        console.log('* Client init...');

        let mac = await si
        .networkInterfaces()
        .then((data) => {
            return data[0].mac;
        });

        let getInitUrl = `${initUrl}?${querystring.stringify({ mac })}`;
        http
        .get(getInitUrl, (res) => {
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

                    shell.exec(COMMAND.SET_DHCP(ip));
                    shell.exec(COMMAND.RESTART_NETWORK);
                    shell.exec(COMMAND.CREATE_INIT_FLAG(ip));
                });
            })
            .catch((err) => {
                console.error(`* Got error: ${err}`);
            });
        })
        .on('error', (e) => {
            console.error(`Got error: ${e.message}`);

            // reset if init error
            setTimeout(() => {
                init();
            }, 2000);
        });
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
})();
