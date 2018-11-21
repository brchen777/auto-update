(() => {
    'use strict';

    const http = require('http');
    const path = require('path');
    const fs = require('fs-extra');
    const shell = require('shelljs');
    const config = require('json-cfg').trunk;
    const { COMMAND } = require('../../lib/constants');

    const { bashPath, workingRoot } = config.conf.runtime;
    const { host, port } = config.conf.server;
    const { filePath: destPath } = config.conf.client;
    const downloadUrl = `http://${host}:${port}/file`;

    module.exports = async (fileName) => {
        let contentDirName = '__content';
        let packPath = path.resolve(workingRoot, `${destPath}/__pack_${new Date().getTime()}`);
        let contentPath = `${packPath}/${contentDirName}`;
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
                let writeResolve;
                const writePromise = new Promise((resolve) => { writeResolve = resolve; });
                let writeStream = fs.createWriteStream(writeFilePath);
                res.pipe(writeStream);
                writeStream.on('finish', () => {
                    console.log('* Package download finish.');
                    writeResolve();
                });
                return writePromise;
            })
            .then(async () => {
                // unzip
                let unzipResolve;
                const unzipPromise = new Promise((resolve) => { unzipResolve = resolve; });
                let shellExec = shell.exec(COMMAND.UNZIP_FILE(fileName, contentDirName), { shell: bashPath, cwd: packPath, async: true });
                shellExec.stdout.on('end', () => {
                    console.log('* Unzip finish.');
                    unzipResolve();
                });
                return unzipPromise;
            })
            .then(async () => {
                // run shell script
                let shResolve;
                const shPromise = new Promise((resolve) => { shResolve = resolve; });
                let shFilePath = `./${contentDirName}/update.sh`;
                let shellExec = await shell.exec(shFilePath, { shell: bashPath, cwd: packPath, async: true });
                shellExec.stdout.on('end', () => {
                    console.log('* Run shell script finish.');
                    shResolve();
                });
                return shPromise;
            })
            .catch((err) => {
                // remove package directory
                fs.removeSync(packPath);
                console.error(err);
            });
        });
    };
})();
