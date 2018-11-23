(() => {
    'use strict';

    const fs = require('fs-extra');
    const path = require('path');
    const config = require('json-cfg').trunk;

    const { workingRoot } = config.conf.runtime;
    const { filePath: destPath } = config.conf.server;

    /** 
     * Repl update command
     * @param {function} handler - broadcast function
     * @param {string} eventName - event name
     * @example update('result.tgz');
     * @returns
    */
    module.exports = (type, handler) => {
        return (fileName, ...args) => {
            let updateFilePath = path.resolve(workingRoot, `${destPath}/${fileName}`);
            if (!fs.existsSync(updateFilePath)) {
                console.error('* File path error');
                return;
            }

            if (typeof handler !== 'function') {
                console.error('* System update error');
                return;
            }
            
            console.log('* System update');
            let eventName = '__system_update';
            if (type === 'one') {
                let [machineId, ...otherArgs] = args;
                handler(machineId, JSON.stringify({ eventName, args: [fileName, ...otherArgs] }));
            }
            else if (type === 'all') {
                handler(JSON.stringify({ eventName, args: [fileName, ...args] }));
            }
        };
    };
})();
