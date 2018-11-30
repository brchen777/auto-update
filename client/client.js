process.on('unhandledRejection', (err) => {
    console.error(`* ${err}`);
    process.exit(1);
});

(async () => {
    'use strict';

    const cluster = require('cluster');
    const { consoleError } = require('../lib/misc');

    if (cluster.isMaster) {
        cluster.fork();
        cluster.on('exit', (worker, code, signal) => {
            consoleError(`Worker ${worker.process.pid} died (${(signal || code)}), Restarting...`);
            cluster.fork();
        });
    }
    else {
        require('./worker');
    }
})();
