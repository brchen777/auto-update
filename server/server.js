(async () => {
    'use strict';

    require('../prepenv.js');
    const config = require('json-cfg').trunk;

    const { host, port } = config.conf.server;
    const repl = require('repl');
    const http = require('http');
    const WebSocket = require('ws');
    const pitaya = require('pitayajs');

    const __handlers = {
        get: {
            '/init': require('./res/get/init'),
            '/file': require('./res/get/file')
        },
        error404: require('./res/error/404')
    };

    const httpServer = http.createServer((req, res) => {
        let method = req.method.toLowerCase();
        let handlerGroup = __handlers[method] || {};
        let { comp: dispatch, url } = pitaya.net.HTTPPullPathComp(req.url);
        let handler = handlerGroup[dispatch];
        if (handler === undefined) {
            return __handlers.error404(req, res, true);
        }

        return handler(req, res, url);
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

    let __repl = repl.start('> ');
    __repl.context.update = require('./repl/update')(wsServer.broadcast, '__system_update');
    __repl.context.zip = require('./repl/zip');

    // test code
    // wsServer.on('connection', () => {
    //     wsServer.broadcast(JSON.stringify({ eventName: '__system_update', args: ['test.tgz'] }));
    // });
})();
