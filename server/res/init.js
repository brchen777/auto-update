(() => {
    'use strict';

    const mongo = require('../mongo');
    const error404 =  require('./error/404');
    const { consoleLog } = require('../../lib/misc');

    module.exports = (req, res) => {
        let body = '';
        return new Promise((resolve) => {
            req
            .on('data', function (data) {
                body += data;
            })
            .on('end', function () {
                resolve(JSON.parse(body));
            });
        })
        .then(async (info) => {
            let result = await mongo.insertOne(info);
            if (!result) {
                error404(req, res, true);
                return;
            }

            let { uid } = info;
            let { ip } = result;
            consoleLog(`Node "${uid}" get ip: "${ip}"`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify(result));
        });
    };
})();
