(() => {
    'use strict';

    const url = require('url');
    const path = require('path');
    const fs = require('fs-extra');
    const error404 = require('./error/404');
    const config = require('json-cfg').trunk;

    const { workingRoot } = config.conf.runtime;
    const MINE_MAP = {
        'js':	'application/javascript',
        'png':	'image/png',
        'jpg':	'image/jpeg',
        'jpeg':	'image/jpeg',
        'tiff':	'image/tiff',
        'tif':	'image/tiff',
        'css':	'text/css',
        'html':	'text/html',
        'htm':	'text/html',
        'lic':	'text/plain',
        'txt':	'text/plain',
        'json':	'application/json'
    };
    
    module.exports = (filePath) => {
        return (req, res, reqPath) => {
            let { pathname: fileName } = url.parse(reqPath);
            let readFilePath = path.resolve(workingRoot, `${filePath}${fileName}`);

            if (fileName === '' || !fs.existsSync(readFilePath)) {
                error404(req, res, true);
                return;
            }

            let ext = fileName.lastIndexOf('.');
            ext = (ext > 0) ? fileName.substring(ext + 1) : '';
            let contentType = MINE_MAP[ext] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': contentType });

            let readFile = fs.createReadStream(readFilePath);
            return new Promise((resolve, reject) => {
                readFile
                .on('end', resolve)
                .on('error', reject)
                .pipe(res);
            });
        };
    };
})();
