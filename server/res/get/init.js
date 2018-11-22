(() => {
    'use strict';

    require('../../../prepenv.js');
    const config = require('json-cfg').trunk;
    const { host: clientHost } = config.conf.client;
    
    module.exports = (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({ ip: clientHost }));
        res.end();
    };
})();
