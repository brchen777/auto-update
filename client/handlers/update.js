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

    module.exports = (ws, fileName) => {
        let ext = fileName.lastIndexOf('.');
        const baseName = (ext > 0) ? fileName.substring(0, ext) : fileName;
        const packPath = path.resolve(workingRoot, `${destPath}/${baseName}`);
        const contentPath = `${packPath}/${contentDirName}`;
        fs.mkdirSync(contentPath, { recursive: true });

        Promise
        .resolve(__main())
        .then(([msgOuts, msgErrs])=>{
            msgOuts = msgOuts.filter(Boolean);
            msgErrs = msgErrs.filter(Boolean);
            ws.send(JSON.stringify({ eventName: '__client-update-finish', args: [baseName, msgOuts.join('\n'), msgErrs.join('\n')] }));
            consoleLog(...msgOuts, 'System update finish');
            consoleError(...msgErrs);
        })
        .catch(([msgOuts, msgErrs]) => {
            msgOuts = msgOuts.filter(Boolean);
            msgErrs = msgErrs.filter(Boolean);
            ws.send(JSON.stringify({ eventName: '__client-update-error', args: [baseName, msgOuts.join('\n'), msgErrs.join('\n')] }));
            consoleLog(...msgOuts, 'System update error');
            consoleError(...msgErrs);
        });

        async function __main() {
            try {
                let res = await __getRequest();

                let results = [];
                results = await __downloadPack(res);
                results = await __unzipPack(results);
                results = await __runSH(results);
                return results
            }
            catch (e) {
                // delete package directory
                fs.removeSync(packPath);
                return e;
            }
        }

        // get request
        function __getRequest() {
            let getResolve, getReject;
            const getPromise = new Promise((resolve, reject) => {
                getResolve = resolve;
                getReject = reject;
            });
            http
            .get(`${downloadUrl}/${fileName}`, (res) => {
                (res.statusCode === 200)
                    ? getResolve(res)
                    : getReject([[], ['File path error']]);
            });
            return getPromise;
        }

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
