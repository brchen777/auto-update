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
        error404: require('./res/error/404'),

        event: {
            '__client-update-info': require('./event').updateClientInfo
        }
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

    wsServer.on('connection', (ws) => {
        ws.on('message', (data) => {
            let { eventName, args } = JSON.parse(data);
            let handlerGroup = __handlers['event'];
            let handler = handlerGroup[eventName];
            if (handler !== undefined) {
                handler(...args);
            }
        });
    });

    await mongo.init();

    let __repl = repl.start('> ');
    __repl.context.zip = require('./repl/zip');
    __repl.context.reboot = require('./repl/reboot');
    __repl.context.update = require('./repl/update')(wsServer.broadcast, '__system_update');

    // test code
    // wsServer.on('connection', () => {
    //     wsServer.broadcast(JSON.stringify({ eventName: '__system_update', args: ['result.tgz'] }));
    // });
})();
