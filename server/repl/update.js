(() => {
    'use strict';

    module.exports = (handler, eventName) => {
        return (fileName) => {
            console.log('System update');
            handler(JSON.stringify({ eventName, args: [fileName] }));
        };
    };
})();
