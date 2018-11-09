(() => {
    'use strict';

    require('../../../prepenv.js');
    const config = require('json-cfg').trunk;
    const fs = require('fs');
    const { workingRoot } = config.conf.runtime;
    const { fileDir: srcDir } = config.conf.server;
    const srcPath = `${workingRoot}/${srcDir}`;
    
    module.exports = (req, res, url) => {
        res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
        
        let fileName = url.replace(/\//gi, '');
        let readFile = fs.createReadStream(`${srcPath}/${fileName}`);
        readFile.on('data', (data) => {
            if (!res.write(data)) { 
                readFile.pause();
            }
        });

        res.on('drain', () => {
            readFile.resume();
        })
          
        readFile.on('end', () => {
            res.end();
        });
    };
})();
