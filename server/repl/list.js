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
            consoleLog('Machine list');
            let result = [];
            Object.entries(machineMap).forEach(([key, val]) => {
                result.push([val.ip, val.uid]);
            });
            consoleLog(result);
        };
    };
})();
