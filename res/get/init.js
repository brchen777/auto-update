(() => {
    'use strict';

    require('../prepenv.js');
    const config = require('json-cfg').trunk;
    const { host } = config.conf.client;
    
    module.exports = (req, res)=>{
        let ip = host;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({ ip }));
        res.end();
    };
})();
