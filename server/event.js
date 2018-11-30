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
        clientUpdateFinish: async (uid, stdout, stderr) => {
            let result = await mongo.updateOne({ uid }, { updateSuccess: true, stdout, stderr });
            if (!result) {
                consoleError(`Node "${uid}" update error (mongodb error)`);
                return;
            }

            consoleLog(`Node "${uid}" update finish`);
        },
        clientUpdateError: async (uid, stdout, stderr) => {
            let result = await mongo.updateOne({ uid }, { updateSuccess: false, stdout, stderr });
            if (!result) {
                consoleError(`Node "${uid}" update error (mongodb error)`);
                return;
            }

            consoleError(`Node "${uid}" update error`);
        }
    };
    module.exports = exportObj;
})();
