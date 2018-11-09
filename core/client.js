(() => {
    'use strict';

    require('../prepenv.js');
    const config = require('json-cfg').trunk;
    const { host, port } = config.conf.server;
    const fs = require('fs');
    const http = require('http');
    const { exec } = require('child_process');

    const __commands = {
        echo_dhcp: (ip) => {
            return [
                'sudo echo "profile static_eth0"        >> /etc/dhcpcd.conf',
                `sudo echo "static ip_address=${ip}/24" >> /etc/dhcpcd.conf`,
                'sudo echo "interface eth0"             >> /etc/dhcpcd.conf',
                'sudo echo "fallback static_eth0"       >> /etc/dhcpcd.conf'
            ];
        },
        touch_init: 'sudo touch .init',
        reboot: 'sudo reboot'
    };

    // check init
    let initFilePath = `${config.conf.workingRoot}/.init`;
    if (!fs.existsSync(initFilePath)) {
        init();
    }
    else {
        run();
    }
    
    function init() {
        http
        .get(`http://${host}:${port}/init`, (res) => {
            let data = '';
            res
            .on('data', (chunk) => {
                data += chunk;
            })
            .on('end', () => {
                let ip = JSON.parse(data).ip;
                for (let command of __commands['echo_dhcp'](ip)) {                
                    exec(command);
                }
                // exec(__commands.reboot);
            });
        })
        .on('error', (e) => {
            console.error(`Got error: ${e.message}`);
        });

        console.log('client init');
    }

    function run() {
        console.log('client running');
    }
})();
