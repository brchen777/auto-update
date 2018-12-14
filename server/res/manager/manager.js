(() => {
    'use strict';

    const roundTo = require('round-to');
    const tmpl	= require('./tmpl/tmpl');
    const mongo = require('../../mongo');
    const config = require('json-cfg').trunk;
    const error404 =  require('../error/404');

    const { maxLastNum = 100 } = config.conf.server.mongodb;

    module.exports = async (req, res) => {
        let result = await mongo.find({ lastNum: { $lt: maxLastNum, $gt: 1 }}, { lastNum: 1 });
        if (!result) {
            error404(req, res, true);
            return;
        }
        result = __calculateInfo(result);

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(tmpl.layout({
            content: tmpl.page.dashboard(),
            init: '' +
`<script>
(() => {
    'use strict';

    window.INPUT_DATA = ${JSON.stringify(result)};

    pipe([
        './res/js/dashboard.js',
        () => { pump.fire('system-ready'); }
    ]);
})();
</script>`
        }));
    };

    function __calculateInfo(input) {
        let output = [];
        input.forEach((node) => {
            let result = {
                id: node.lastNum,
                uid: node.uid,
                cpu: [], mem: 0, disk: {}, time: 0
            };

            // cpu
            node.cpu.forEach((cpu) => {
                let total = 0;
                for (let type in cpu.times) {
                    total += cpu.times[type];
                }
                result.cpu.push(roundTo((total - cpu.times.idle) / total * 100, 2));
            });

            // mem
            result.mem = roundTo((node.mem.total - node.mem.available) / node.mem.total * 100, 2);

            // disk
            node.disk.forEach((disk) => {
                let id = disk.fs;
                result.disk[id] = roundTo(disk.use, 2);
            });

            // alive time
            result.aliveTime = roundTo(node.aliveTime / 1000, 0);

            // last update time
            result.lastUpdateTime = roundTo(node.lastUpdateTime / 1000, 0);

            output.push(result);
        });
        return output;
    }
})();
