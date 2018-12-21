(() => {
    'use strict';

    const config = require('json-cfg').trunk;
    const { MongoClient } = require('mongodb');
    const { STATUS } = require('../lib/constants');

    const { host: clientHost } = config.conf.client;
    const { host: dbHost, port: dbPort, dbName, colName, initLastNum: maxLastNum = 100 } = config.conf.server.mongodb;
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
            const maxDbLastNum = await collection
            .find({ lastNum: { $lt: maxLastNum, $gt: 1 }})
            .sort({ lastNum: -1 })
            .limit(1)
            .toArray()
            .then(([data]) => {
                return ((data) ? data.lastNum : 2);
            });

            let lastNum = (maxLastNum > maxDbLastNum && maxDbLastNum > 1) ? maxDbLastNum + 1 : 2;
            let ipClasses = clientHost.split('.');
            ipClasses.splice(-1, 1, lastNum.toString());
            let ip = ipClasses.join('.');

            // add new node info
            const insertedId = await collection
            .insertOne({
                uid, ip, lastNum, cpu, mem, disk,
                status: STATUS.INIT,
                initTime: time,
                aliveTime: time,
                lastPackName: '',
                lastUpdateTime: time
            })
            .then((data) => {
                return data.insertedId;
            });
            return { id: insertedId, ip };
        },

        find: async (filter, sort) => {
            if (!__isObject(filter) || !__isObject(sort) || !collection) return;

            let nodes = await collection
            .find(filter)
            .sort(sort)
            .toArray();
            return nodes;
        },

        updateOne: async (filter, info) => {
            if (!__isObject(filter) || !__isObject(info) || !collection) return;

            let time = Date.now();
            info.aliveTime = time;
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
