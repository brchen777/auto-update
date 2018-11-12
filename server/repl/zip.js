(() => {
    'use strict';

    const { exec } = require('child_process');
    const { COMMAND } = require('../../lib/constants');

    /** 
     * Repl zip command
     * @param {string} srcPath - source files path
     * @param {string} destPath - zip destination path
     * @example zip('./file/src', './file/update/result.tgz')
     * @returns
    */
    module.exports = (srcPath, destPath) => {
        exec(COMMAND.ZIP_FILE(destPath), { cwd: srcPath });
    };
})();
