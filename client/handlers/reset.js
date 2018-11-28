(() => {
    'use strict';

    const shell = require('shelljs');
    const config = require('json-cfg').trunk;
    const { COMMAND } = require('../../lib/constants');

    const { bashPath } = config.conf.runtime;

    module.exports = async () => {
        shell.exec(COMMAND.DELETE_DHCP(), { shell: bashPath });
        shell.exec(COMMAND.RESTART_NETWORK, { shell: bashPath });
        shell.exec(COMMAND.DELETE_INIT_FLAG(), { shell: bashPath });
        process.exit(0);
    };
})();
