
(async () => {
    require('colors');
    const path = require('path');
    const fs = require('fs-extra');
    const shell = require('shelljs');
    const config = require('json-cfg').trunk;

    let conf = path.resolve(`${__dirname}/config.json`);

    // Load conf
    if (!fs.existsSync(conf)) {
        console.log('No config file existed! Using default...'.red);
        conf = path.resolve(`${__dirname}/config.default.json`);
    }

    if (!shell.which('bash')) {
        console.error('Sorry, this script requires bash');
        shell.exit(1);
    }
    let { stdout: bashPath } = shell.which('bash');

    console.log(`${('Loading config file "').green}${conf.yellow}${('"...').green}`);
    config.load(conf);
    config.conf.runtime = {
        conf,
        bashPath,
        workingRoot: __dirname
    };
})();
