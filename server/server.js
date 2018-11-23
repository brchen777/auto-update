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
    const { STATUS } = require('../lib/constants');

    const { host, port } = config.conf.server;
    const HANDLERS = {
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
        let handlerGroup = HANDLERS[method] || {};
        let urlParse = url.parse(req.url);
        let { comp: dispatch, url: remainUrl } = pitaya.net.HTTPPullPathComp(urlParse.pathname);
        let handler = handlerGroup[dispatch];
        if (handler === undefined) {
            HANDLERS.error404(req, res, true);
            return;
        }

        handler(req, res, remainUrl);
    });
    httpServer.listen(port, host);

    const wsServer = await new WebSocket.Server({ server: httpServer, handshakeTimeout: 5000 });
    Object.assign(wsServer, {
        machineMap: {},
        send: function (machineId, data) {
            if (!machineId) return;
    
            let client = this.machineMap[machineId];
            if (client && client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        },
        broadcast: function (data) {
            this.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(data);
                }
            });
        }
    });

    wsServer
    .on('connection', (ws, req) => {
        const ip = req.connection.remoteAddress;
        ws
        .on('message', (data) => {
            let dataParse = JSON.parse(data);
            if (Object(dataParse) !== dataParse) return;

            let { eventName, args } = JSON.parse(data);
            if (eventName === '__client-client-open') {
                let [machineId] = args;
                wsServer.machineMap[machineId] = ws;
            }
            else {
                let handlerGroup = HANDLERS['event'];
                let handler = handlerGroup[eventName];
                if (typeof handler !== 'function') return;

                handler(...args);
            }
        })
        .on('close', async () => {
            await mongo.updateStatus({ ip }, STATUS.DIED);
            let machineId = __getKeyByValue(wsServer.machineMap, ws);
            delete wsServer.machineMap[machineId];
        });
    })
    .on('open', (...args) => {
        console.log(args);
    });

    await mongo.init();

    let REPL = repl.start('> ');
    REPL.context.zip = require('./repl/zip');
    REPL.context.update = require('./repl/update')('one', wsServer.send);
    REPL.context.updateAll = require('./repl/update')('all', wsServer.broadcast);
    REPL.context.reboot = require('./repl/reboot')('one', wsServer.send);
    REPL.context.rebootAll = require('./repl/reboot')('all', wsServer.broadcast);
    REPL.context.test = () => {
        wsServer.broadcast(JSON.stringify({ eventName: 'test', args: ['123'] }));
    };

    // test code
    // wsServer.on('connection', async () => {
    //     const { sleep } = require('../lib/misc');
    //     await sleep(3);
    //     // wsServer.broadcast(JSON.stringify({ eventName: '__system_update', args: ['result.tgz'] }));
    //     // wsServer.send('a3c15624203d2968deb57e523207dffe74d5ea9615bad176bf500828613e20d0', JSON.stringify({ eventName: '__system_update', args: ['result.tgz'] }));
    //     // wsServer.send('f2407ce9597442a2b07aebc67e6c15e7', JSON.stringify({ eventName: '__system_update', args: ['result.tgz'] }));

    //     // wsServer.broadcast(JSON.stringify({ eventName: '__system_reboot', args: [] }));
    //     // wsServer.send('a3c15624203d2968deb57e523207dffe74d5ea9615bad176bf500828613e20d0', JSON.stringify({ eventName: '__system_reboot', args: [] }));
    //     // wsServer.send('f2407ce9597442a2b07aebc67e6c15e7', JSON.stringify({ eventName: '__system_reboot', args: [] }));
    // });

    function __getKeyByValue(obj, value) {
        return Object.keys(obj).find(key => obj[key] === value);
    }
})();
