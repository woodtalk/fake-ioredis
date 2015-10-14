// Created by woodtalk on 2015-10-13.
'use strict';


const spawn = require('child_process').spawn;
const execSync = require('child_process').execSync;
const path = require('path');
const debug = require('debug')('RedisServer');

let subdir = 'win32/Redis-x64-2.8.2103';
switch (process.platform) {
    case 'win32':
        if (process.arch === 'x64') {
            subdir = `${process.platform}/Redis-x64-2.8.2103`;
        }
        break;
    default:
        break;
}

const config = path.join(__dirname, `./redis-server/redis.conf`);

class RedisServer {
    constructor() {
        this.port = Math.floor(Math.random() * (60000 - 10000 + 1) + 10000);

        const cmd = path.join(__dirname, `./redis-server/${subdir}/redis-server.exe`);

        this.process = spawn(cmd, [config, '--port', this.port]);

        let loadingExpire = Date.now() + 3000;
        while (isListeningPort(this.port, this.process.pid)) {
            if (loadingExpire <= Date.now()) {
                throw new Error('redis server load timeout');
            }
        }

        debug(`start redis server - pid: ${this.process.pid}, port: ${this.port}`);
    }

    kill() {
        this.process.kill('SIGTERM');
    }
}

function isListeningPort(port) {
    let cmd = null;
    if (process.platform === 'win32') {
        cmd = `netstat -ano | find "${port}"`;
    }
    if (cmd === null) {
        throw new Error('os invalid');
    }

    try {
        execSync(cmd, {encoding: 'utf8'});
        return true;
    } catch (e) {
        return false;
    }
}

module.exports = RedisServer;