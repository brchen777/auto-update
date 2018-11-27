(() => {
    'use strict';

    const mongo = require('./mongo');
    const { consoleLog, consoleError } = require('../lib/misc');

    let exportObj = {
        updateClientInfo: async (data) => {
            let { id, uid } = await mongo.updateOne(data);
            if (id) {
                consoleLog(`Node "${uid}" update sysInfo finish`);
            }
            else {
                consoleError('Node update sysInfo error');
            }
        }
    };
    module.exports = exportObj;
})();
