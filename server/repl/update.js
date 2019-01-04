(() => {
    'use strict';

    const path = require('path');
    const fs = require('fs-extra');
    const shell = require('shelljs');
    const config = require('json-cfg').trunk;
    const { COMMAND } = require('../../lib/constants');
    const { consoleLog, consoleError } = require('../../lib/misc');

    const { workingRoot, bashPath } = config.conf.runtime;
    const { filePath: updatePath } = config.conf.server;

    /** 
     * @param {string} type - one: use send function, all: use broadcast function
     * @param {string} handler - send or broadcast function
     * @returns {function}
    */
    module.exports = (type, handler) => {
        /**
         * Repl update command
         * @param {string} srcPath - zip file path
         * @example updateAll('./srcDir');
         * @example update('./srcDir', ['ca832f67f4c8e1d8bce7f4ee2ff9bfab']);
         */
        return (srcPath = '', ...args) => {
            srcPath = path.resolve(workingRoot, updatePath, srcPath);
            const fileName = `__pack_${Date.now()}.tgz`;
            const destPath = `${updatePath}/${fileName}`;

            Promise
            .resolve(__main())
            .then(([msgOuts = [], msgErrs = []])=>{
                msgOuts = msgOuts.filter(Boolean);
                msgErrs = msgErrs.filter(Boolean);
                consoleLog(...msgOuts, 'System update finish');
                consoleError(...msgErrs);
            })
            .catch(([msgOuts = [], msgErrs = []]) => {
                msgOuts = msgOuts.filter(Boolean);
                msgErrs = msgErrs.filter(Boolean);
                consoleLog(...msgOuts, 'System update error');
                consoleError(...msgErrs);
            });
            
            async function __main() {
                let results = [];
                results = await __init();
                results = await __zipPack(results);
                results = await __triggerHandler(results);
                return results
            }

            // check file path and handler
            function __init() {
                let initResolve, initReject;
                const initPromise = new Promise((resolve, reject) => {
                    initResolve = resolve;
                    initReject = reject;
                });
                if (!fs.existsSync(srcPath) || !fs.existsSync(`${srcPath}/update.sh`)) {
                    initReject([['File path error'], []]);
                }
                else if (typeof handler !== 'function') {
                    initReject([['Handler error'], []]);
                }
                else {
                    initResolve([], ['Init finish']);
                }
                return initPromise;
            }

            // zip
            function __zipPack([msgOut = [], msgErr = []]) {
                let zipResolve, zipReject;
                const zipPromise = new Promise((resolve, reject) => {
                    zipResolve = resolve;
                    zipReject = reject;
                });
                shell.exec(COMMAND.ZIP_FILE(destPath), { shell: bashPath, cwd: srcPath }, (code, stdout, stderr) => {
                    (code !== 0)
                        ? zipReject([[...msgOut, stdout, 'Zip error'], [...msgErr, stderr]])
                        : zipResolve([[...msgOut, stdout, 'Zip finish'], [...msgErr, stderr]]);
                });
                return zipPromise;
            }

            // trigger send or broadcast handler
            function __triggerHandler([msgOut = [], msgErr = []]) {
                let eventName = '__system-update';
                if (type === 'one') {
                    let [uids = [], ...otherArgs] = args;
                    uids = Array.isArray(uids) ? uids : [uids];
                    uids.forEach((uid) => {
                        handler(uid, JSON.stringify({ eventName, args: [fileName, ...otherArgs] }));
                    });
                }
                else if (type === 'all') {
                    handler(JSON.stringify({ eventName, args: [fileName, ...args] }));
                }
                return Promise.resolve([[...msgOut, 'Trigger handler finish'], [...msgErr]]);
            }
        };
    };
})();
