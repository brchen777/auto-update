(() => {
    'use strict';

    const os = require('os');
    const path = require('path');
    const config = require('json-cfg').trunk;

    const { workingRoot } = config.conf.runtime;
    const preCommandStr = (os.platform() === 'win32') ? '' : 'sudo';

    let exportObj = {
        STATUS: {
            DIED: 0,
            ALIVE: 1,
            INIT: 2,
        },

        COMMAND: {
            REBOOT: `${preCommandStr} reboot`,
            RESTART_NETWORK: `${preCommandStr} ip link set eth0 down && ${preCommandStr} ip link set eth0 up`,

            CREATE_INIT_FLAG: (str) => {
                let initFlagPath = path.resolve(workingRoot, './__init');
                return `${preCommandStr} echo "${str}" >> "${initFlagPath}"`;
            },

            DELETE_INIT_FLAG: () => {
                let initFlagPath = path.resolve(workingRoot, './__init');
                return `${preCommandStr} rm -rf "${initFlagPath}"`;
            },

            /** 
             * Add dhcp ip in config
             * @param {string} ip
             * @returns {string}
            */
            SET_DHCP: (ip) => {
                let commands = [
                    'profile static_eth0',
                    `static ip_address=${ip}/24`,
                    'interface eth0',
                    'fallback static_eth0',
                    ''
                ];
                return `${preCommandStr} echo -e "${commands.join('\n')}" >> "/etc/dhcpcd.conf"`;
            },

            /** 
             * Delete dhcp ip in config
             * @returns {string}
            */
            DELETE_DHCP: () => {
                let lineCnt = 5;
                return `${preCommandStr} sed -i -n -e :a -e "1,${lineCnt}!{P;N;D;};N;ba" "/etc/dhcpcd.conf"`;
            },

            /** 
             * Zip files to tgz file
             * @param {string} destPath - zip destination path
             * @example tar -zcf ./result.tgz ./*
             * @returns {string}
            */
            ZIP_FILE: (destPath) => {
                destPath = path.resolve(workingRoot, destPath);
                return `${preCommandStr} tar --force-local -zcf "${destPath}" ./*`;
            },

            /** 
             * Unzip tgz file to files
             * @param {string} srcPath - zip file path
             * @param {string} destPath - unzip destination path
             * @returns {string}
            */
            UNZIP_FILE: (srcPath, destPath='./') => {
                return `${preCommandStr} tar -xf "${srcPath}" -C "${destPath}"`;
            },

            /** 
             * Run shell script
             * @param {string} srcPath - shell script file path
             * @returns {string}
            */
            RUN_SH: (srcPath) => {
                return `${preCommandStr} sh "${srcPath}"`;
            }
        }
    };
    module.exports = exportObj;
})();
