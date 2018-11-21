(() => {
    'use strict';

    require('../../prepenv');
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
    module.exports = (handler, eventName) => {
        return (fileName) => {
            let updateFilePath = path.resolve(workingRoot, `${destPath}/${fileName}`);
            if (!fs.existsSync(updateFilePath)) {
                console.error('* File path error');
                return;
            }

            console.log('* System update');
            handler(JSON.stringify({ eventName, args: [fileName] }));
        };
    };
})();
