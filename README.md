# Auto-Update - An automatic update client node system #

## For user ##

### How to use ###

#### Server Side ####

1. Setting config file:

    File structure:
    ``` javascript
    {
        "server": {
            "host": @string,                // server host
            "port": @int,                   // server port
            "filePath": @string,            // package upload path
            "mongodb": {
                "host": @string,            // db host
                "port": @int,               // db port
                "dbName": @string,          // db name in mongodb
                "colName": @string,         // collection name in mongodb
                "maxLastNum": @int          // maximum last number for selecting ip range in mongodb
            },
            "socket": {
                "port": @int                // socket port for remote repl
            }
        },
        "client": {
            "host": @string,                // client host
            "port": @int,                   // client port
            "filePath": @string,            // package download path
            "preCommand": [ @string, ... ], // pre-command for each command line
            "delayTimeout": @int,           // init delay timeout at the first time (millisecond)
            "sendTimeout": @int             // timeout for each sending system info event (millisecond)
        }
    }
    ```

    Config example:
    ``` javascript
    // config.default.json
    {
        "server": {
            "host": "192.168.0.253",
            "port": 1234,
            "filePath": "./file/update",
            "mongodb": {
                "host": "127.0.0.1",
                "port": 27017,
                "dbName": "auto-update",
                "colName": "node",
                "maxLastNum": 100
            },
            "socket": {
                "port": 1235
            }
        },
        "client": {
            "host": "192.168.0.1",
            "port": 1234,
            "filePath": "./file/download",
            "preCommand": ["sudo"],         // use sudo in linux system
            "delayTimeout": 5000,
            "sendTimeout": 30000
        }
    }
    ```

2. Run server
    > npm run server

3. Use Repl mode, you can use:

    (1) Zip files to a package:
    > zip(source_files_path, zip_destination_path);

    Example:
    > zip('./file/src', './file/update/result.tgz');

    (2) Broadcast all clients to download package and unzip it:
    > updateAll(package_name_in_upload_path);

    Example:
    > updateAll('result.tgz');

    (3) Send designated client to download package and unzip it:
    > update(package_name_in_upload_path, uid_array);

    Example:
    > update('result.tgz', ['ca832f67f4c8e1d8bce7f4ee2ff9bfab']);

    (4) Broadcast all clients to reboot:
    > rebootAll();

    (5) Send designated client to reboot:
    > reboot(uid_array);

    Example:
    > reboot(['ca832f67f4c8e1d8bce7f4ee2ff9bfab']);

    (6) Send designated client to reset ip:
    > reset(uid_array);

    Example:
    > reset(['ca832f67f4c8e1d8bce7f4ee2ff9bfab']);

    * Note: After unzip package, client will run "update.sh", so you should prepare "update.sh" in your source files path.

#### Client Side ####

1. Setting config file (It is equal to server side).

2. Run client
    > npm run client

3. Get new ip at the first time

4. Each client will send system info after init

## For maintainer ##

### Install project ###

* Clone project:
    > git clone \<project-url\>

* Install dependency package:
    > npm install

### Build and Run ###

* Run server (use npm):
    > npm run server

* Run client (use npm):
    > npm run client
