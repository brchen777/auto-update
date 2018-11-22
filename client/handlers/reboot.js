(() => {
    'use strict';

    const shell = require('shelljs');
    const config = require('json-cfg').trunk;
    const { machineId } = require('node-machine-id');
    const { COMMAND } = require('../../lib/constants');

    const { bashPath } = config.conf.runtime;

    module.exports = async (id = null) => {
        let localId = await machineId({ original: true });
        if (id !== null && id !== localId) return;

        shell.exec(COMMAND.REBOOT, { shell: bashPath });
    };
})();
