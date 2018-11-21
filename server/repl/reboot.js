(() => {
    'use strict';

    /** 
     * Repl reboot command
     * @param {function} handler - broadcast function
     * @param {string} eventName - event name
     * @example reboot();
     * @returns
    */
    module.exports = (handler, eventName) => {
        return () => {
            console.log('* System reboot');
            handler(JSON.stringify({ eventName, args: [] }));
        };
    };
})();
