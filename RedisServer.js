// Created by woodtalk on 2015-10-13.
'use strict';

const os = 'win';
const versioned = 'Redis-x64-2.8.2103';

const childProcess = require('child_process');
const path = require('path');

class RedisServer {
    constructor() {
        this.port = Math.floor(Math.random() * (60000 - 10000 + 1) + 10000);

        const cmd = path.join(__dirname, `./utils/${os}/${versioned}/redis-server.exe`);
        const config = path.join(__dirname, `./utils/redis.conf`);

        this.process = childProcess.spawn(cmd, [config, '--port', this.port]);

        let loadingExpire = Date.now() + 3000;
        while (isListeningPort(this.port)) {
            if (loadingExpire <= Date.now()) {
                throw new Error('redis server load timeout');
            }
        }
    }

    kill() {
        this.process.kill('SIGTERM');
    }
}

function isListeningPort(port) {
    try {
        childProcess.execSync(`netstat -ano | find "${this.port}"`, {encoding: 'utf8'});
        return true;
        //console.log(`start redis server - pid: ${this.process.pid}, port: ${this.port}`);
    } catch (e) {
        //console.error(e);
        return false;
    }
}

module.exports = RedisServer;