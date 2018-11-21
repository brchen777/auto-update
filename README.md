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
                "colName": @string          // collection name in mongodb
            }
        },
        "client": {
            "host": @string,                // client host
            "port": @int,                   // client port
            "filePath": @string,            // package download path
            "preCommand": [ @string, ... ], // pre-command for each command line
            "delayTimeout": @int,           // init delay timeout at the first time (millisecond)
            "updateTimeout": @int           // update timeout for each sending system info event (millisecond)
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
                "colName": "node"
            }
        },
        "client": {
            "host": "192.168.0.1",
            "port": 1234,
            "filePath": "./file/download",
            "preCommand": ["sudo"],         // use sudo in linux system
            "delayTimeout": 5000,
            "updateTimeout": 30000
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
    > update(package_name_in_upload_path);

    Example:
    > update('result.tgz');

    (3) Broadcast all clients to reboot:
    > reboot();

    Or Broadcast client to designated reboot:
    > reboot(machine_id);

    Example:
    > reboot('f2407ce9597442a2b07aebc67e6c15e7');

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
