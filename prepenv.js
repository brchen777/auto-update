
(async () => {
    require('colors');
    const fs = require('fs-extra');
    const path = require('path');
    const shell = require('shelljs');
    const config = require('json-cfg').trunk;

    const env = { conf: path.resolve(`${__dirname}/config.json`) };

    // Load conf
    if (!fs.existsSync(env.conf)) {
        console.log('* No config file existed! Using default...'.red);
        env.conf = path.resolve(`${__dirname}/config.default.json`);
    }

    if (!shell.which('bash')) {
        console.error('Sorry, this script requires bash');
        shell.exit(1);
    }
    let { stdout: __bashPath } = shell.which('bash');

    console.log(`${('* Loading config file "').green}${env.conf.yellow}${('"...').green}`);
    config.load(env.conf);

    env.bashPath = __bashPath;
    env.workingRoot = __dirname;
    config.conf.runtime = env;
})();
