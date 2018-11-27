(() => {
    'use strict';

    const mongo = require('./mongo');

    let exportObj = {
        updateClientInfo: async (data) => {
            let { id, uid, time } = await mongo.updateOne(data);
            if (id) {
                console.log(`* Node "${uid}" update sysInfo finish (${new Date(time).toLocaleString()}).`);
            }
            else {
                console.error(`* Node update sysInfo error.`);
            }
        }
    };
    module.exports = exportObj;
})();
