(() => {
    'use strict';

    const { shell } = require('shelljs');
    const config = require('json-cfg').trunk;
    const { COMMAND } = require('../../lib/constants');

    const { bashPath } = config.conf.runtime;

    /** 
     * Repl zip command
     * @param {string} srcPath - source files path
     * @param {string} destPath - zip destination path
     * @example zip('./file/src', './file/update/result.tgz')
     * @returns
    */
    module.exports = async (srcPath, destPath) => {
        shell.exec(COMMAND.ZIP_FILE(destPath), { shell: bashPath, cwd: srcPath });
    };
})();
