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
        GET: {
            '/init': require('./res/get/init'),
            '/files': require('./res/get/files')
        },
        POST: {
        },
        ERROR404: require('./res/error/404')
    };

    const httpServer = http.createServer((req, res) => {
        let handlerGroup = __handlers[req.method] || {};
        let { comp: dispatch, url } = pitaya.net.HTTPPullPathComp(req.url);
        let handler = handlerGroup[dispatch];
        if (handler === undefined) {
            return __handlers.ERROR404(req, res, true);
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

    const __update = require('./repl/update')(wsServer.broadcast, '__system_update');
    repl.start('> ').context.update = __update;
})();
