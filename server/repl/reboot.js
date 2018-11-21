(() => {
    'use strict';

    const shell = require('shelljs');
    const config = require('json-cfg').trunk;
    const { COMMAND } = require('../../lib/constants');

    const { bashPath } = config.conf.runtime;

    /** 
     * Repl reboot command
     * @example reboot();
     * @returns
    */
    module.exports = () => {
        return () => {
            shell.exec(COMMAND.REBOOT(), { shell: bashPath });
        };
    };
})();
