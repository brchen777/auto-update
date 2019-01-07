# Auto-Update - An automatic update client node system #

## For user ##

### How to use ###

#### Server Side ####

1. Setting config file:

    File structure:
    ``` javascript
    {
        "server": {
            "host": @string,                    // server host
            "port": @int,                       // server port
            "filePath": @string,                // package upload path
            "mongodb": {
                "host": @string,                // db host
                "port": @int,                   // db port
                "dbName": @string,              // db name in mongodb
                "colName": @string,             // collection name in mongodb
                "initLastNum": @int,            // maximum last number for selecting ip range in mongodb
                "managerLastNum": @int          // maximum last number for showing ip range in manager
            },
            "socket": {
                "connection": [ ... ]           // param for socket listen
            }
        },
        "client": {
            "host": @string,                    // client host
            "port": @int,                       // client port
            "filePath": @string,                // package download path
            "updateEnvPath": @string,           // config file path for setting environment variable before running update.sh
            "delayTimeout": @int,               // init delay timeout at the first time (millisecond)
            "sendTimeout": @int                 // timeout for each sending system info event (millisecond)
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
                "initLastNum": 100,
                "managerLastNum": 150
            },
            "socket": {
                "connection": [1235, "0.0.0.0"]
            }
        },
        "client": {
            "host": "192.168.0.1",
            "port": 1234,
            "filePath": "./file/download",
            "updateEnvPath": "../.env/config.json",
            "delayTimeout": 5000,
            "sendTimeout": 30000
        }
    }
    ```

2. Run server
    > npm run server

3. Use Netcat to connect socket:
    > nc socket_connection_host socket_connection_port

    Example:
    > nc 127.0.0.1 1235

4. In repl mode, you can use:

    (1) Zip files to a package, broadcast all clients to download and unzip it:
    > updateAll(src_path_in_upload_path);

    Example:
    > updateAll('./dir');

    * Note: After unzip package, client will run "update.sh", so you should prepare "update.sh" in your source files path.

    (2) Zip files to a package, send designated client to download and unzip it:
    > update(src_path_in_upload_path, uid_array);

    Example:
    > update('./dir', ['ca832f67f4c8e1d8bce7f4ee2ff9bfab']);

    (3) Broadcast all clients to reboot:
    > rebootAll();

    (4) Send designated client to reboot:
    > reboot(uid_array);

    Example:
    > reboot(['ca832f67f4c8e1d8bce7f4ee2ff9bfab']);

    (5) Send designated client to reset ip:
    > reset(uid_array);

    Example:
    > reset(['ca832f67f4c8e1d8bce7f4ee2ff9bfab']);

    (6) Show connect device list:
    > deviceList();

5. Usage browser to open manager page

    Manager url: `http://${server_host}:${server_port}/manager`

    Example url: http://192.168.0.253:1234/manager

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
