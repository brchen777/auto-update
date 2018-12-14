(() => {
    'use strict';

    const mongo = require('./mongo');
    const { STATUS } = require('../lib/constants');
    const { consoleLog, consoleError } = require('../lib/misc');

    let exportObj = {
        clientSendSysInfo: async (uid, info) => {
            info.status = STATUS.ALIVE;
            let result = await mongo.updateOne({ uid }, info);
            if (!result) {
                consoleError(`Node "${uid}" send sysInfo error (mongodb error)`);
                return;
            }

            consoleLog(`Node "${uid}" send sysInfo finish`);
        },
        clientUpdateFinish: async (uid, packName, stdout, stderr) => {
            let info = {
                updateSuccess: true,
                lastPackName: packName,
                lastUpdateTime: Date.now(),
                stdout, stderr
            };
            let result = await mongo.updateOne({ uid }, info);
            if (!result) {
                consoleError(`Node "${uid}" update "${packName}" error (mongodb error)`);
                return;
            }

            consoleLog(`Node "${uid}" update "${packName}" finish`);
        },
        clientUpdateError: async (uid, packName, stdout, stderr) => {
            let info = {
                updateSuccess: true,
                stdout, stderr
            };
            let result = await mongo.updateOne({ uid }, info);
            if (!result) {
                consoleError(`Node "${uid}" update "${packName}" error (mongodb error)`);
                return;
            }

            consoleError(`Node "${uid}" update "${packName}" error`);
        }
    };
    module.exports = exportObj;
})();
