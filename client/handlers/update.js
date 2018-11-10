(() => {
    'use strict';

    const config = require('json-cfg').trunk;
    const http = require('http');
    const fs = require('fs-extra');
    const { host, port, filePath: srcPath } = config.conf.server;
    const { filePath: destPath } = config.conf.client;
    const downloadUrl = `http://${host}:${port}/${srcPath}`;

    module.exports = (fileName) => {
        let writeFilePath = `${destPath}/__pack_${new Date().getTime()}`;
        fs.mkdirSync(writeFilePath, { recursive: true });
        http
        .get(`${downloadUrl}/${fileName}`, (res) => {
            // rm -rf writeFilePath
            if (res.statusCode === 404) {
                fs.removeSync(writeFilePath);
                console.error('File path error');
                return;
            }

            let writeFile = fs.createWriteStream(`${writeFilePath}/${fileName}`);
            res.pipe(writeFile);
            writeFile.on('finish', () => {
                writeFile.close();
                console.log('System update finish');
            });
        });
    };
})();
