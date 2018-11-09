(() => {
    'use strict';

    require('../../prepenv.js');
    const fs = require('fs-extra');
    const config = require('json-cfg').trunk;
    const { packPath } = config.conf.server;

    module.exports = (handler, eventName) => {
        return (fileName) => {
            if (!fs.existsSync(`${packPath}/${fileName}`)) {
                console.error('File path error');
                return;
            }

            console.log('System update');
            handler(JSON.stringify({ eventName, args: [fileName] }));
        };
    };
})();
