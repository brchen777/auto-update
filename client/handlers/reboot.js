(() => {
    'use strict';

    const shell = require('shelljs');
    const config = require('json-cfg').trunk;
    const { COMMAND } = require('../../lib/constants');

    const { bashPath } = config.conf.runtime;

    module.exports = async () => {
        shell.exec(COMMAND.REBOOT, { shell: bashPath });
    };
})();
