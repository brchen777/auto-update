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
     * @example updateAll('result.tgz');
     * @example update('9e850088de36b4e9de1f8df822ad68ee527cae543b5e730249cb478efc55bba5', 'result.tgz');
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
                let [uid, ...otherArgs] = args;
                handler(uid, JSON.stringify({ eventName, args: [fileName, ...otherArgs] }));
            }
            else if (type === 'all') {
                handler(JSON.stringify({ eventName, args: [fileName, ...args] }));
            }
        };
    };
})();
