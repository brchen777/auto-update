(() => {
    'use strict';

    const path = require('path');
    const fs = require('fs-extra');
    const config = require('json-cfg').trunk;
    const { consoleLog, consoleError } = require('../../lib/misc');

    const { workingRoot } = config.conf.runtime;
    const { filePath: destPath } = config.conf.server;

    /** 
     * Repl update command
     * @param {string} type - one: use send function, all: use broadcast function
     * @param {string} handler - send or broadcast function
     * @example updateAll('result.tgz');
     * @example update('result.tgz', ['ca832f67f4c8e1d8bce7f4ee2ff9bfab']);
     * @returns {function}
    */
    module.exports = (type, handler) => {
        return (fileName, ...args) => {
            let updateFilePath = path.resolve(workingRoot, `${destPath}/${fileName}`);
            if (!fs.existsSync(updateFilePath)) {
                consoleError('File path error');
                return;
            }

            if (typeof handler !== 'function') {
                consoleError('System update error');
                return;
            }
            
            consoleLog('System update');
            let eventName = '__system-update';
            if (type === 'one') {
                let [uids, ...otherArgs] = args;
                uids.forEach((uid) => {
                    handler(uid, JSON.stringify({ eventName, args: [fileName, ...otherArgs] }));
                });
            }
            else if (type === 'all') {
                handler(JSON.stringify({ eventName, args: [fileName, ...args] }));
            }
        };
    };
})();
