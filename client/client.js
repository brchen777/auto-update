(() => {
    'use strict';

    require('../prepenv.js');
    const config = require('json-cfg').trunk;
    const fs = require('fs');
    const http = require('http');
    const WebSocket = require('ws');
    const { exec } = require('child_process');
    const { host, port } = config.conf.server;
    const { workingRoot } = config.conf.runtime;
    const initUrl = `http://${host}:${port}/init`;
    const wsUrl = `ws://${host}:${port}`;

    const __commands = {
        echoDhcp: (ip) => {
            return [
                'sudo echo "profile static_eth0"        >> /etc/dhcpcd.conf',
                `sudo echo "static ip_address=${ip}/24" >> /etc/dhcpcd.conf`,
                'sudo echo "interface eth0"             >> /etc/dhcpcd.conf',
                'sudo echo "fallback static_eth0"       >> /etc/dhcpcd.conf'
            ];
        },
        touchInit: 'sudo touch .init',
        reboot: 'sudo reboot'
    };

    const __handlers = {
        __system_update: require('./handlers/update')
    };

    // check init
    let initFilePath = `${workingRoot}/.init`;
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
                for (let command of __commands['echoDhcp'](ip)) {
                    exec(command);
                }
                exec(__commands.touchInit);
                // exec(__commands.reboot);
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
