(() => {
    'use strict';

    /** 
     * Repl reboot command
     * @param {function} handler - broadcast function
     * @param {string} eventName - event name
     * @example reboot();
     * @returns
    */
    module.exports = (type, handler) => {
        return (...args) => {
            if (typeof handler !== 'function') {
                console.log('* System reboot error');
                return;
            }

            console.log('* System reboot');
            let eventName = '__system_reboot';
            if (type === 'one') {
                let [machineId, ...otherArgs] = args;
                handler(machineId, JSON.stringify({ eventName, args: [...otherArgs] }));
            }
            else if (type === 'all') {
                handler(JSON.stringify({ eventName, args: [...args] }));
            }
        };
    };
})();
