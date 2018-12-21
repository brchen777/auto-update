(async () => {
    'use strict';

    require('../prepenv');
    const net = require('net');
    const url = require('url');
    const repl = require('repl');
    const http = require('http');
    const WebSocket = require('ws');
    const mongo = require('./mongo');
    const pitaya = require('pitayajs');
    const config = require('json-cfg').trunk;
    const { STATUS } = require('../lib/constants');
    const { consoleError } = require('../lib/misc');

    const { host: serverHost, port: serverPort, filePath: destPath } = config.conf.server;
    const { connection: socketConn } = config.conf.server.socket;
    const HANDLERS = {
        get: {
            '/file': require('./res/file')(destPath),
            '/res': require('./res/file')('./res'),
            '/manager': require('./res/manager/manager')
        },
        post: {
            '/init': require('./res/init')
        },
        error404: require('./res/error/404'),
        
        event: {                 
            '__client-send-sysInfo': require('./event').clientSendSysInfo,
            '__client-update-finish': require('./event').clientUpdateFinish,
            '__client-update-error': require('./event').clientUpdateError
        }
    };
    
    let serverRetryCnt = 0;
    const httpServer = http.createServer((req, res) => {
        let method = req.method.toLowerCase();
        let handlerGroup = HANDLERS[method] || {};
        let urlParse = url.parse(req.url);
        let { comp: dispatch, url: remainUrl } = pitaya.net.HTTPPullPathComp(urlParse.pathname);
        let handler = handlerGroup[dispatch];

        Promise.resolve()
        .then(() => {
            if (!handler) {
                return HANDLERS.error404(req, res, true);
            }
            else {
                return handler(req, res, remainUrl);
            }
        })
        .then(() => {
            if (!res.finished) {
                res.end();
            }
        })
        .catch((err) => {
            consoleError(err);
            HANDLERS.error404(req, res, true);
        });
    })
    .on('error', function (e) {
        serverRetryCnt++;
        if (serverRetryCnt <= 10) {
            setTimeout(() => {
                httpServer.close();
                httpServer.listen(serverPort, serverHost);
            }, 1000);
        }
        else {
            consoleError(e);
            process.exit(1);
        }
    });

    httpServer.listen(serverPort, serverHost);

    const wsServer = new WebSocket.Server({ server: httpServer, handshakeTimeout: 5000 });
    Object.assign(wsServer, {
        machineMap: {},
        send: function (uid, data) {
            if (!uid) return;

            let client = this.machineMap[uid];
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
        ws
        .on('message', (data) => {
            let dataParse = JSON.parse(data);
            if (Object(dataParse) !== dataParse) return;

            let { eventName, args = [] } = dataParse;
            if (eventName === '__client-ws-open') {
                let [uid] = args;
                ws.uid = uid;
                ws.ip = req.connection.remoteAddress;
                wsServer.machineMap[uid] = ws;
            }
            else {
                let { uid } = ws;
                let handlerGroup = HANDLERS['event'];
                let handler = handlerGroup[eventName];
                if (typeof handler !== 'function') return;

                handler(uid, ...args);
            }
        })
        .on('close', async () => {
            let { uid } = ws;
            await mongo.updateOne({ uid }, { status: STATUS.DIED });
            delete wsServer.machineMap[uid];
        });
    });

    await mongo.init();

    let ReplContext = {
        update: require('./repl/update')('one', wsServer.send.bind(wsServer)),
        updateAll: require('./repl/update')('all', wsServer.broadcast.bind(wsServer)),
        reboot: require('./repl/reboot')('one', wsServer.send.bind(wsServer)),
        rebootAll: require('./repl/reboot')('all', wsServer.broadcast.bind(wsServer)),
        reset: require('./repl/reset')('one', wsServer.send.bind(wsServer)),
        deviceList: require('./repl/list')(wsServer.machineMap)
    };

    // remote socket api
    net.createServer((socket) => {
        const replInst = repl.start({
            prompt: 'Node.js via Unix socket> ',
            input: socket,
            output: socket
        })
        .on('exit', () => {
            socket.end();
        });
    
        Object.assign(replInst.context, ReplContext);
    }).listen(...socketConn);
})();
