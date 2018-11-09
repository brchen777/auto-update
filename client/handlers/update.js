(() => {
    'use strict';

    const config = require('json-cfg').trunk;
    const http = require('http');
    const fs = require('fs');
    const { workingRoot } = config.conf.runtime;
    const { host, port, fileDir: srcDir } = config.conf.server;
    const { fileDir: distDir } = config.conf.client;
    const downloadUrl = `http://${host}:${port}/${srcDir}`;
    const distPath = `${workingRoot}/${distDir}`;

    module.exports = (fileName) => {
        let writeFile = fs.createWriteStream(`${distPath}/${fileName}`);
        http
        .get(`${downloadUrl}/${fileName}`, (res) => {
            res.pipe(writeFile);
            writeFile.on('finish', () => {
                writeFile.close();
            });
        });
    };
})();
