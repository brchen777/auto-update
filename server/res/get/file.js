(() => {
    'use strict';

    require('../../../prepenv');
    const config = require('json-cfg').trunk;
    const fs = require('fs-extra');
    const path = require('path');

    const { workingRoot } = config.conf.runtime;
    const { filePath } = config.conf.server;
    const error404 =  require('../error/404');
    
    module.exports = (req, res, url) => {
        let fileName = (url) ? url.replace(/\//gi, '') : '';
        let readFilePath = path.resolve(workingRoot, `${filePath}/${fileName}`);
        if (fileName === '' || !fs.existsSync(readFilePath)) {
            error404(req, res, true);
            return;
        }

        res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
        let readFile = fs.createReadStream(readFilePath);
        readFile
        .on('data', (data) => {
            if (!res.write(data)) { 
                readFile.pause();
            }
        })
        .on('end', () => {
            res.end();
        });

        res.on('drain', () => {
            readFile.resume();
        })
    };
})();
