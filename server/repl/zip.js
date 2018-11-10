(() => {
    'use strict';

    const { exec } = require('child_process');
    const { COMMAND } = require('../../lib/constants');

    module.exports = (srcPath, destPath) => {
        exec(COMMAND.ZIP_TAR_GZ(srcPath, destPath));
    };
})();
