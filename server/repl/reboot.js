(() => {
    'use strict';

    /** 
     * Repl reboot command
     * @param {function} handler - broadcast function
     * @param {string} eventName - event name
     * @example rebootAll();
     * @example reboot('9e850088de36b4e9de1f8df822ad68ee527cae543b5e730249cb478efc55bba5');
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
