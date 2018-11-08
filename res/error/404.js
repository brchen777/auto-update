(() => {
    'use strict';

    module.exports = (req, res, serveHTML=true) => {
        if (serveHTML) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.write(HTML404());
        }
        else {
            res.writeHead( 404, { 'Content-Type': 'text/plain' });
            res.write('File Not Found!');
        }
        res.end();
    };
    
    function HTML404() {
        return '' +
`<!DOCTYPE html>
<html>
    <head>
        <link type='text/css' rel='stylesheet' href='//res.purimize.com/lib/css/oops.min.css' />
        <style>
            body {font-size:16px;}
            main { width:100vw; height:100vh; }
            .error {font-size:3em; font-weight:bolder; color:#000;}
        </style>
    </head>
    <body>
        <main class='v-center t-center'>
            <div class='error'>Oops 404!<br>File is not found!</div>
        </main>
    </body>
</html>
`;
    }
})();
