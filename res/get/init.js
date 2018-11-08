(() => {
    'use strict';
    
    module.exports = (req, res)=>{
        let ip  = '127.0.0.1';
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({ ip }));
        res.end();
    };
})();
