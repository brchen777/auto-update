(() => {
    'use strict';

    require('../prepenv.js');
    const config = require('json-cfg').trunk;

    const { initFlagPath, preCommands } = config.conf.client;

    let PRE_COMMAND = (preCommands.length > 0) ? preCommands.join(' ') : '';
    let exportObj = {
        COMMAND: {
            REBOOt: `${PRE_COMMAND} reboot`,
            CREATE_INIT_FLAG: (ip) => {
                return `${PRE_COMMAND} echo "${ip}" >> ${initFlagPath}`;
            },
            SET_DHCP: (ip) => {
                return [
                    `${PRE_COMMAND} echo "profile static_eth0"        >> /etc/dhcpcd.conf`,
                    `${PRE_COMMAND} echo "static ip_address=${ip}/24" >> /etc/dhcpcd.conf`,
                    `${PRE_COMMAND} echo "interface eth0"             >> /etc/dhcpcd.conf`,
                    `${PRE_COMMAND} echo "fallback static_eth0"       >> /etc/dhcpcd.conf`
                ];
            },
            /** 
             * @param {string} srcPath - source files path
             * @param {string} destPath - zip destination path
             * @example tar -zcf ./result.tar.gz dirName
             * @returns
            */
            ZIP_TAR_GZ: (srcPath, destPath) => {
                return `${PRE_COMMAND} tar -zcf ${destPath} ${srcPath}`;
            },
            /** 
             * @param {string} srcPath - zip file path
             * @param {string} destPath - uzip destination path
             * @returns {string}
            */
            UZIP_TAR_GZ: (srcPath, destPath='') => {
                return `${PRE_COMMAND} tar -xf ${srcPath} -C ${destPath}`;
            }
        }
    };
    module.exports = exportObj;
})();
