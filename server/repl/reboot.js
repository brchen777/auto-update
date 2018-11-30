(() => {
    'use strict';

    const { consoleLog } = require('../../lib/misc');

    /** 
     * Repl reboot command
     * @param {string} type - one: use send function, all: use broadcast function
     * @param {string} handler - send or broadcast function
     * @example rebootAll();
     * @example reboot(['ca832f67f4c8e1d8bce7f4ee2ff9bfab']);
     * @returns {function}
    */
    module.exports = (type, handler) => {
        return (...args) => {
            if (typeof handler !== 'function') {
                consoleLog('System reboot error');
                return;
            }

            consoleLog('System reboot');
            let eventName = '__system-reboot';
            if (type === 'one') {
                let [uids, ...otherArgs] = args;
                uids.forEach((uid) => {
                    handler(uid, JSON.stringify({ eventName, args: [...otherArgs] }));
                });
            }
            else if (type === 'all') {
                handler(JSON.stringify({ eventName, args: [...args] }));
            }
        };
    };
})();
