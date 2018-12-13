(() => {
    'use strict';

    const http = require('http');
    const path = require('path');
    const fs = require('fs-extra');
    const shell = require('shelljs');
    const config = require('json-cfg').trunk;
    const { COMMAND } = require('../../lib/constants');
    const { consoleLog, consoleError } = require('../../lib/misc');

    const { bashPath, workingRoot } = config.conf.runtime;
    const { host: serverHost, port: serverPort } = config.conf.server;
    const { filePath: destPath } = config.conf.client;
    const downloadUrl = `http://${serverHost}:${serverPort}/file`;
    const contentDirName = '__content';
    const packPath = path.resolve(workingRoot, `${destPath}/__pack_${Date.now()}`);
    const contentPath = `${packPath}/${contentDirName}`;
    
    module.exports = (ws, fileName) => {
        fs.mkdirSync(contentPath, { recursive: true });

        http
        .get(`${downloadUrl}/${fileName}`, (res) => {
            new Promise((resolve, reject) => {
                // check response status code
                (res.statusCode === 200) ? resolve(res) : reject([[], ['File path error']]);
            })
            .then(__downloadPack)
            .then(__unzipPack)
            .then(__runSH)
            .then(([msgOuts, msgErrs]) => {
                msgOuts = msgOuts.filter(Boolean);
                msgErrs = msgErrs.filter(Boolean);
                ws.send(JSON.stringify({ eventName: '__client-update-finish', args: [msgOuts.join('\n'), msgErrs.join('\n')] }));
                consoleLog(...msgOuts, 'Update finish');
                consoleError(...msgErrs);
            })
            .catch(([msgOuts, msgErrs]) => {
                msgOuts = msgOuts.filter(Boolean);
                msgErrs = msgErrs.filter(Boolean);
                ws.send(JSON.stringify({ eventName: '__client-update-error', args: [msgOuts.join('\n'), msgErrs.join('\n')] }));
                // remove package directory
                fs.removeSync(packPath);
                consoleLog(...msgOuts, 'Update error');
                consoleError(...msgErrs);
            });
        });

        // download package
        function __downloadPack(res) {
            let writeFilePath = path.resolve(workingRoot, `${packPath}/${fileName}`);
            let writeResolve, writeReject;
            const writePromise = new Promise((resolve, reject) => {
                writeResolve = resolve;
                writeReject = reject;
            });
            let writeStream = fs.createWriteStream(writeFilePath);
            res.pipe(writeStream);
            writeStream
            .on('finish', () => {
                writeResolve([['Package download finish'], []]);
            })
            .on('error', (err) => {
                writeReject([[], [err]]);
            });
            return writePromise;
        }

        // unzip
        function __unzipPack([msgOut=[], msgErr=[]]) {
            let unzipResolve, unzipReject;
            const unzipPromise = new Promise((resolve, reject) => {
                unzipResolve = resolve;
                unzipReject = reject;
            });
            shell.exec(COMMAND.UNZIP_FILE(fileName, contentDirName), { shell: bashPath, cwd: packPath }, (code, stdout, stderr) => {
                (code !== 0)
                    ? unzipReject([[...msgOut, stdout, 'Unzip error'], [...msgErr, stderr]])
                    : unzipResolve([[...msgOut, stdout, 'Unzip finish'], [...msgErr, stderr]]);
            });
            return unzipPromise;
        }

        // run shell script
        function __runSH([msgOut=[], msgErr=[]]) {
            let shFilePath = `./update.sh`;
            let shResolve, shReject;
            const shPromise = new Promise((resolve, reject) => {
                shResolve = resolve;
                shReject = reject;
            });
            shell.exec(COMMAND.RUN_SH(shFilePath), { shell: bashPath, cwd: contentPath }, (code, stdout, stderr) => {
                (code !== 0)
                    ? shReject([[...msgOut, stdout, 'Run shell script error'], [...msgErr, stderr]])
                    : shResolve([[...msgOut, stdout, 'Run shell script finish'], [...msgErr, stderr]]);
            });
            return shPromise;
        }
    };
})();
