(() => {
    'use strict';

    const config = require('json-cfg').trunk;
    const { MongoClient } = require('mongodb');
    const { STATUS } = require('../lib/constants');

    const { host: clientHost } = config.conf.client;
    const { host: dbHost, port: dbPort, dbName, colName } = config.conf.server.mongodb;
    const dbUrl = `mongodb://${dbHost}:${dbPort}/`;
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
            if (!__isObject(info) || !collection) return;

            let { uid, cpu, mem, disk } = info;
            const nodeData = await collection.findOne({ uid });
            if (nodeData) return { id: nodeData._id, ip: nodeData.ip };

            let time = Date.now();

            // get max lastNum
            const maxLastNum = await collection
            .find({ lastNum: { $lt: 253, $gt: 1 }})
            .sort({ lastNum: -1 })
            .limit(1)
            .toArray()
            .then(([data]) => {
                return ((data) ? data.lastNum : 2);
            });

            let lastNum = (253 > maxLastNum && maxLastNum > 1) ? maxLastNum + 1 : 2;
            let ipClasses = clientHost.split('.');
            ipClasses.splice(-1, 1, lastNum.toString());
            let ip = ipClasses.join('.');

            // add new node info
            const insertedId = await collection
            .insertOne({
                uid, ip, lastNum, cpu, mem, disk,
                status: STATUS.INIT,
                initTime: time,
                updateTime: time
            })
            .then((data) => {
                return data.insertedId;
            });
            return { id: insertedId, ip };
        },

        updateOne: async (filter, info) => {
            if (!__isObject(filter) || !__isObject(info) || !collection) return;

            let time = Date.now();
            info.updateTime = time;
            let node = await collection
            .findOneAndUpdate(
                filter,
                { $set: info },
                { returnNewDocument: true }
            )
            .then((data) => {
                return data.value;
            });
            return node;
        },

        deleteOne: async (filter) => {
            if (!__isObject(filter) || !collection) return;

            collection.deleteOne(filter);
        },

        deleteAll: () => {
            if (!collection) return;

            collection.deleteMany({});
        }
    }
    module.exports = exportObj;

    function __isObject(data) {
        return (data && (Object(data) === data));
    }
})();
