(() => {
    'use strict';

    const http = require('http');

    let exportObj = {
        postJson: async (url, data) => {
            let postData = JSON.stringify(data);
            let postOption = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }

            let postJsonResolve, postJsonReject;
            const postPromise = new Promise((resolve, reject) => {
                postJsonResolve = resolve;
                postJsonReject = reject;
            });

            let req = http.request(url, postOption, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    res.body = data;
                    return postJsonResolve(res);
                });
            })
            .on('error', (err) => {
                return postJsonReject(err);
            });
            req.write(postData);
            req.end();

            return postPromise;
        },
        sleep: (ms) => {
            return new Promise((resolve) => {
                setTimeout(resolve, ms);
            });
        }
    };
    module.exports = exportObj;
})();
