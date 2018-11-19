(() => {
    'use strict';

    const mongo = require('./mongo');

    let exportObj = {
        updateClientInfo: async (data) => {
            let { id, time } = await mongo.updateOne(data);
            if (id) {
                console.log(`* Node ${data.machineId} update sysInfo finish (${new Date(time).toLocaleString()}).`);
            }
            else {
                console.error(`* Node update sysInfo error.`);
            }
        }
    };
    module.exports = exportObj;
})();
