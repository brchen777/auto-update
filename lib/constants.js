(() => {
    'use strict';

    require('../prepenv');
    const path = require('path');
    const config = require('json-cfg').trunk;

    const { workingRoot } = config.conf.runtime;
    const { preCommand } = config.conf.client;
    const PRE_COMMAND = (Array.isArray(preCommand)) ? preCommand.join(' ') : '';

    let exportObj = {
        COMMAND: {
            REBOOT: `${PRE_COMMAND} reboot`,
            RESTART_NETWORK: `${PRE_COMMAND} ip link set eth0 down && ${PRE_COMMAND} ip link set eth0 up`,

            CREATE_INIT_FLAG: (ip) => {
                let initFlagPath = path.resolve(workingRoot, './__init');
                return `${PRE_COMMAND} echo "${ip}" >> "${initFlagPath}"`;
            },

            /** 
             * Add dhcp ip in config
             * @param {string} ip
             * @returns {string[]}
            */
            SET_DHCP: (ip) => {
                let content = [
                    "profile static_eth0",
                    `static ip_address=${ip}/24`,
                    "interface eth0",
                    "fallback static_eth0"
                ];
                return `${PRE_COMMAND} echo -e "${content.join('\n')}" >> "/etc/dhcpcd.conf"`;
            },

            /** 
             * Zip files to tgz file
             * @param {string} destPath - zip destination path
             * @example tar -zcf ./result.tgz ./*
             * @returns {string}
            */
            ZIP_FILE: (destPath) => {
                destPath = path.resolve(workingRoot, destPath);
                return `${PRE_COMMAND} tar --force-local -zcf "${destPath}" ./*`;
            },

            /** 
             * Unzip tgz file to files
             * @param {string} srcPath - zip file path
             * @param {string} destPath - unzip destination path
             * @returns {string}
            */
            UNZIP_FILE: (srcPath, destPath='./') => {
                return `${PRE_COMMAND} tar -xf "${srcPath}" -C "${destPath}"`;
            },

            /** 
             * Run shell script
             * @param {string} srcPath - shell script file path
             * @returns {string}
            */
            RUN_SH: (srcPath) => {
                return `${PRE_COMMAND} sh "${srcPath}"`;
            }
        }
    };
    module.exports = exportObj;
})();
