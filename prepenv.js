
(() => {
    require('colors');
    const fs = require('fs-extra');
    const config = require('json-cfg').trunk;
    const env = { conf: `${__dirname}/config.json` };

    // Load conf
    if (!fs.existsSync(env.conf)) {
        console.log('* No config file existed! Using default...'.red);
        env.conf = `${__dirname}/config.default.json`;
    }

    console.log(`${('* Loading config file "').green}${env.conf.yellow}${('"...').green}`);
    config.load(env.conf);
    env.workingRoot = __dirname;
    config.conf.runtime = env;
})();
