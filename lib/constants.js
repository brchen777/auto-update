(() => {
    'use strict';

    let exportObj = {
        COMMAND: {
            REBOOt: 'sudo reboot',
            CREATE_INIT_FLAG: (ip) => {
                return `sudo echo "${ip}" >> ./__init`;
            },
            SET_DHCP: (ip) => {
                return [
                    'sudo echo "profile static_eth0"        >> /etc/dhcpcd.conf',
                    `sudo echo "static ip_address=${ip}/24" >> /etc/dhcpcd.conf`,
                    'sudo echo "interface eth0"             >> /etc/dhcpcd.conf',
                    'sudo echo "fallback static_eth0"       >> /etc/dhcpcd.conf'
                ];
            },
            /** 
             * @param {string} srcPath - source files path
             * @param {string} destPath - zip destination path (without '.tar.gz') 
             * @returns
            */
            ZIP_TAR_GZ: (srcPath, destPath) => {
                return `sudo tar -zcf ${destPath}.tar.gz ${srcPath}`;
            },
            /** 
             * @param {string} srcPath - zip file path (without '.tar.gz')
             * @param {string} destPath - uzip destination path
             * @returns {string}
            */
            UZIP_TAR_GZ: (srcPath, destPath) => {
                return `sudo tar -xf ${srcPath}.tar.gz ${destPath}`;
            }
        }
    };
    module.exports = exportObj;
})();
