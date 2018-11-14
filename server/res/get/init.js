(() => {
    'use strict';

    const mongo = require('../../mongo');
    const url = require('url');
    
    const error404 =  require('../error/404');

    module.exports = async (req, res) => {
        let urlParse = url.parse(req.url, true);
        let { mac } = urlParse.query;
        let result = await mongo.insertOne(mac);
        if (!result) {
            error404(req, res, true);
            return;
        }

        let { id, ip } = result;
        console.log(`* Node "${id}" get ip: "${ip}"`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({ ip }));
        res.end();
    };
})();
