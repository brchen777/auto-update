
(async () => {
    require('colors');
    const path = require('path');
    const fs = require('fs-extra');
    const shell = require('shelljs');
    const config = require('json-cfg').trunk;
    const { consoleLog, consoleError } = require('./lib/misc');

    let conf = path.resolve(`${__dirname}/config.json`);

    // Load conf
    if (!fs.existsSync(conf)) {
        consoleLog('No config file existed! Using default...'.red);
        conf = path.resolve(`${__dirname}/config.default.json`);
    }

    if (!shell.which('bash')) {
        consoleError('Sorry, this script requires bash');
        shell.exit(1);
    }
    let { stdout: bashPath } = shell.which('bash');

    consoleLog(`${('Loading config file "').green}${conf.yellow}${('"...').green}`);
    config.load(conf);
    config.conf.runtime = {
        conf,
        bashPath,
        workingRoot: __dirname
    };
})();
