(() => {
    'use strict';

    const mongo = require('../mongo');
    const error404 =  require('./error/404');

    module.exports = (req, res) => {
        let body = '';
        new Promise((resolve) => {
            req.on('data', function (data) {
                body += data;
            });
    
            req.on('end', function () {
                resolve(JSON.parse(body));
            });
        })
        .then(async (info) => {
            let result = await mongo.insertOne(info);
            if (!result) {
                error404(req, res, true);
                return;
            }
    
            let { id, ip } = result;
            console.log(`* Node "${id}" get ip: "${ip}"`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({ ip }));
            res.end();
        });
    };
})();
