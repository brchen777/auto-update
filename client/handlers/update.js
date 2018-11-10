(() => {
    'use strict';

    const config = require('json-cfg').trunk;
    const http = require('http');
    const fs = require('fs-extra');
    const { exec } = require('child_process');
    const { COMMAND } = require('../../lib/constants');

    const { host, port, filePath: srcPath } = config.conf.server;
    const { filePath: destPath } = config.conf.client;
    const downloadUrl = `http://${host}:${port}/${srcPath}`;

    module.exports = async (fileName) => {
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

        // test code
        // let result = await http.get(`${downloadUrl}/${fileName}`, (res) => {
        //     let filePath = `${writeFilePath}/${fileName}`;
        //     return new Promise((resolve, reject) => {
        //         (res.statusCode === 404) ? reject('File path error') : resolve(res);
        //         // reject(res);
        //     })
        //     .then((res) => {
        //         let writePrepared;
        //         const writePromise = new Promise((resolve) => { writePrepared = resolve });
        //         let writeFile = fs.createWriteStream(filePath);
        //         res.pipe(writeFile);
        //         writeFile.on('finish', () => {
        //             writeFile.close();
        //             console.log('Package download fininsh.');
        //             writePrepared();
        //         });
        //         return writePromise;
        //     })
        //     .then((data) => {
        //         // unzip
        //         let command = COMMAND.UZIP_TAR_GZ(filePath);
        //         console.log(command);
        //         exec(command);
        //         console.log('Unzip finish.');
        //     })
        //     .catch((err) => {
        //         fs.removeSync(writeFilePath);
        //         console.error(err);
        //     });
        // });
    };
})();
