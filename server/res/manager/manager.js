(() => {
    'use strict';

    const roundTo = require('round-to');
    const tmpl	= require('./tmpl/tmpl');
    const mongo = require('../../mongo');
    const config = require('json-cfg').trunk;
    const error404 =  require('../error/404');

    const { managerLastNum: maxLastNum = 150 } = config.conf.server.mongodb;

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
                cpu: 0, mem: 0, disk: {}
            };

            let { cpu, mem, disk = [], aliveTime, lastPackName, lastUpdateTime } = node;

            // cpu
            result.cpu = (cpu) ? roundTo(cpu * 100, 2) : 0;

            // mem
            result.mem = (mem) ? roundTo((mem.total - mem.available) / mem.total * 100, 2) : 0;

            // disk
            disk.forEach((disk) => {
                let id = disk.fs;
                result.disk[id] = roundTo(disk.use, 2);
            });

            // alive time
            result.aliveTime = (aliveTime) ? roundTo(aliveTime / 1000, 0) : 0;

            // last pack name
            result.lastPackName = lastPackName || '-';

            // last update time
            result.lastUpdateTime = (lastUpdateTime) ? roundTo(lastUpdateTime / 1000, 0) : 0;

            output.push(result);
        });
        return output;
    }
})();
