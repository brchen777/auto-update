(async () => {
    'use strict';

    require('../prepenv');
    const url = require('url');
    const repl = require('repl');
    const http = require('http');
    const WebSocket = require('ws');
    const mongo = require('./mongo');
    const pitaya = require('pitayajs');
    const config = require('json-cfg').trunk;

    const { host, port } = config.conf.server;
    
    const __handlers = {
        get: {
            '/file': require('./res/file')
        },
        post: {
            '/init': require('./res/init')
        },
        error404: require('./res/error/404')
    };

    const httpServer = http.createServer((req, res) => {
        let method = req.method.toLowerCase();
        let handlerGroup = __handlers[method] || {};
        let urlParse = url.parse(req.url);
        let { comp: dispatch, url: remainUrl } = pitaya.net.HTTPPullPathComp(urlParse.pathname);
        let handler = handlerGroup[dispatch];
        if (handler === undefined) {
            return __handlers.error404(req, res, true);
        }

        return handler(req, res, remainUrl);
    });
    httpServer.listen(port, host);

    const wsServer = await new WebSocket.Server({ server: httpServer });
    wsServer.broadcast = (data) => {
        wsServer.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    };

    await mongo.init();

    let __repl = repl.start('> ');
    __repl.context.update = require('./repl/update')(wsServer.broadcast, '__system_update');
    __repl.context.zip = require('./repl/zip');

    // test code
    // wsServer.on('connection', () => {
    //     wsServer.broadcast(JSON.stringify({ eventName: '__system_update', args: ['result.tgz'] }));
    // });
})();
