(() => {
    'use strict';

    require('../prepenv.js');
    const config = require('json-cfg').trunk;
    const fs = require('fs-extra');
    const http = require('http');
    const WebSocket = require('ws');
    const { exec } = require('child_process');
    const { COMMAND } = require('../lib/constants');

    const { host, port } = config.conf.server;
    const { workingRoot } = config.conf.runtime;
    const initUrl = `http://${host}:${port}/init`;
    const wsUrl = `ws://${host}:${port}`;

    const __handlers = {
        __system_update: require('./handlers/update')
    };

    // check init
    let initFilePath = `${workingRoot}/__init`;
    if (!fs.existsSync(initFilePath)) {
        init();
    }
    else {
        run();
    }
    
    function init() {
        console.log('Client init...');
        
        http
        .get(initUrl, (res) => {
            let data = '';
            res
            .on('data', (chunk) => {
                data += chunk;
            })
            .on('end', () => {
                let ip = JSON.parse(data).ip;
                let commands = COMMAND.SET_DHCP(ip);
                for (let command of commands) {
                    exec(command);
                }
                exec(COMMAND.CREATE_INIT_FLAG(ip));
                // exec(COMMAND.REBOOt);
            });
        })
        .on('error', (e) => {
            console.error(`Got error: ${e.message}`);
        });
    }

    function run() {
        console.log('Client running...');

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
