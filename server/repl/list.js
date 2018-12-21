(() => {
    'use strict';

    const { consoleLog } = require('../../lib/misc');

    /** 
     * @param {Object} machineMap
     * @returns {function}
    */
    module.exports = (machineMap) => {
        /** 
         * Repl device list command
         * @example deviceList();
        */
        return () => {
            let list = [];
            Object.entries(machineMap).forEach(([key, val]) => {
                list.push([val.ip, val.uid]);
            });

            // sort lastNum
            list.sort((val1, val2) => {
                let lastNumIdx1 = val1[0].lastIndexOf('.');
                let lastNum1 = (lastNumIdx1 > 0) ? parseInt(val1[0].substring(lastNumIdx1 + 1)) : val1[0];

                let lastNumIdx2 = val2[0].lastIndexOf('.');
                let lastNum2 = (lastNumIdx2 > 0) ? parseInt(val2[0].substring(lastNumIdx2 + 1)) : val2[0];

                if (lastNum1 < lastNum2) {
                    return -1;
                }
                else if (lastNum1 > lastNum2) {
                    return 1;
                }
                return 0;
            });

            return {
                cnt: list.length,
                list
            };
        };
    };
})();
