(() => {
    'use strict';

    const mongo = require('../mongo');
    const { consoleLog } = require('../../lib/misc');

    /** 
     * @param {string} type - one: use send function, all: use broadcast function
     * @param {string} handler - send or broadcast function
     * @returns {function}
    */
    module.exports = (type, handler) => {
        /** 
         * Repl reset command
         * @example reset(['ca832f67f4c8e1d8bce7f4ee2ff9bfab']);
        */
        return (...args) => {
            if (typeof handler !== 'function') {
                consoleLog('System reset error');
                return;
            }

            consoleLog('System reset');
            let eventName = '__system-reset';
            if (type === 'one') {
                let [uids, ...otherArgs] = args;
                uids.forEach((uid) => {
                    mongo.deleteOne({ uid });
                    handler(uid, JSON.stringify({ eventName, args: [...otherArgs] }));
                });
            }
        };
    };
})();
