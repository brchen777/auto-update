(() => {
    'use strict';

    const { consoleLog } = require('../../lib/misc');

    /** 
     * Repl reboot command
     * @param {function} handler - broadcast function
     * @param {string} eventName - event name
     * @example rebootAll();
     * @example reboot('ca832f67f4c8e1d8bce7f4ee2ff9bfab');
     * @returns
    */
    module.exports = (type, handler) => {
        return (...args) => {
            if (typeof handler !== 'function') {
                consoleLog('System reboot error');
                return;
            }

            consoleLog('System reboot');
            let eventName = '__system_reboot';
            if (type === 'one') {
                let [uid, ...otherArgs] = args;
                handler(uid, JSON.stringify({ eventName, args: [...otherArgs] }));
            }
            else if (type === 'all') {
                handler(JSON.stringify({ eventName, args: [...args] }));
            }
        };
    };
})();
