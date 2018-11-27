(() => {
    'use strict';

    const shell = require('shelljs');
    const config = require('json-cfg').trunk;
    const { consoleLog } = require('../../lib/misc');
    const { COMMAND } = require('../../lib/constants');

    const { bashPath } = config.conf.runtime;

    /** 
     * Repl zip command
     * @param {string} srcPath - source files path
     * @param {string} destPath - zip destination path
     * @example zip('./file/src', './file/update/result.tgz');
     * @returns
    */
    module.exports = (srcPath, destPath) => {
        let shellExec = shell.exec(COMMAND.ZIP_FILE(destPath), { shell: bashPath, cwd: srcPath, async: true });
        shellExec.stdout.on('end', () => {
            consoleLog('Zip finish');
        });
    };
})();
