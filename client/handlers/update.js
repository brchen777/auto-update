(() => {
    'use strict';

    const config = require('json-cfg').trunk;
    const http = require('http');
    const fs = require('fs-extra');
    const path = require('path');
    const shell = require('shelljs');
    const { COMMAND } = require('../../lib/constants');

    const { workingRoot } = config.conf.runtime;
    const { host, port } = config.conf.server;
    const { filePath: destPath } = config.conf.client;
    const downloadUrl = `http://${host}:${port}/file`;

    module.exports = async (fileName) => {
        let packPath = path.resolve(workingRoot, `${destPath}/__pack_${new Date().getTime()}`);
        let contentPath = `${packPath}/__content`;
        fs.mkdirSync(contentPath, { recursive: true });

        http
        .get(`${downloadUrl}/${fileName}`, (res) => {
            let writeFilePath = path.resolve(workingRoot, `${packPath}/${fileName}`);
            new Promise((resolve, reject) => {
                // check response status code
                (res.statusCode === 200) ? resolve(res) : reject('File path error');
            })
            .then((res) => {
                // download package
                let writePrepared;
                const writePromise = new Promise((resolve) => { writePrepared = resolve; });
                let writeFile = fs.createWriteStream(writeFilePath);
                res.pipe(writeFile);
                writeFile.on('finish', () => {
                    console.log('* Package download finish.');
                    writePrepared();
                });
                return writePromise;
            })
            .then(async () => {
                // unzip
                // await exec(COMMAND.UNZIP_FILE(writeFilePath, contentPath));
                await shell.exec(COMMAND.UNZIP_FILE(writeFilePath, contentPath), { async: true });
                console.log('* Unzip finish.');
            })
            .then(async () => {
                // run shell script
                let shFilePath = path.resolve(workingRoot, `${contentPath}/update.sh`);
                const { stdout, stderr } = await shell.exec(COMMAND.RUN_SH(shFilePath), { async: true });
                if (stderr) {
                    console.error('* Stderr:', stderr);
                }
                console.log(stdout);
                console.log('* Run shell script finish.');
            })
            .catch((err) => {
                // remove package directory
                fs.removeSync(packPath);
                console.error(err);
            });
        });
    };
})();
