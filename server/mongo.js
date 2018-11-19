(() => {
    'use strict';

    const config = require('json-cfg').trunk;
    const { MongoClient } = require('mongodb');

    const { host: clientIp } = config.conf.client;
    const { host, port, dbName, colName } = config.conf.server.mongodb;
    const dbUrl = `mongodb://${host}:${port}/`;
    let collection = null;

    let exportObj = {
        init: () => {
            return new Promise(async (resolve) => {
                // init mongodb
                const connect = await MongoClient.connect(dbUrl);
                resolve(connect.db(dbName));
            })
            .then((db) => {
                collection = db.collection(colName);
            });
        },

        insertOne: async (info) => {
            if (!info || !collection) return;

            let { machineId, cpu, mem, disk } = info;
            const nodeData = await collection.findOne({ machineId });
            if (nodeData) return { id: nodeData._id, ip: nodeData.ip };

            let time = new Date().getTime();

            // get max lastNum
            const maxLastNum = await collection
            .find({})
            .sort({ lastNum: -1 })
            .limit(1)
            .toArray()
            .then(([data]) => {
                return ((data) ? data.lastNum : 1);
            });

            let lastNum = (maxLastNum >= 1 && maxLastNum < 253) ? maxLastNum + 1 : 1;
            let ipClasses = clientIp.split('.');
            ipClasses.splice(-1, 1, lastNum.toString());
            let ip = ipClasses.join('.');

            // add new node info
            const insertedId = await collection
            .insertOne({
                ip,
                lastNum,
                machineId,
                cpu,
                mem,
                disk,
                status: 1,
                initTime: time,
                updateTime: time
            })
            .then((data) => {
                return data.insertedId;
            });
            return { id: insertedId, ip, time };
        },

        updateOne: async (info) => {
            if (!info || !collection) return;

            let time = new Date().getTime();
            let { machineId, cpu, mem, disk } = info;
            let updateId = await collection
            .findOneAndUpdate(
                { machineId },
                { $set: {
                    cpu, mem, disk,
                    updateTime: time
                }}
            )
            .then((data) => {
                return ((data) ? data.value._id : null);
            });
            return { id: updateId, time };
        },

        deleteAll: () => {
            if (!collection) return;
            collection.deleteMany({});
        }
    }

    module.exports = exportObj;
})();
