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
        const cmd = path.join(__dirname, `./redis-server/${subdir}/redis-server`);
        const loadingExpire = Date.now() + 1000;

        this.port = findIdlePort(loadingExpire);
        this.process = spawn(cmd, [config, '--port', this.port]);

        while (isListeningPort(this.port, this.process.pid)) {
            if (Date.now() >= loadingExpire) {
                throw new Error(`redis server load timeout - try pid: ${this.process.pid}, port: ${this.port}`);
            }
        }

        debug(`start redis server - pid: ${this.process.pid}, port: ${this.port}`);
    }

    kill() {
        this.process.kill('SIGTERM');
    }
}

function isListeningPort(port, pid) {
    let cmd = null;

    if (process.platform === 'win32') {
        cmd = `netstat -ano | find "0.0.0.0:${port}" | find "LISTENING" > nul`;
        if (pid) {
            cmd = `netstat -ano | find "0.0.0.0:${port}" | find "LISTENING" | find "${pid}" > nul`;
        }
    } else {
        cmd = `netstat -anp 2> /dev/null | grep 0.0.0.0:${port} | grep LISTEN`;
        if (pid) {
            cmd = `netstat -anp 2> /dev/null | grep 0.0.0.0:${port} | grep LISTEN | grep ${pid}`;
        }
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

function findIdlePort(loadingExpire) {
    do {
        var port = Math.floor(Math.random() * (60000 - 30000 + 1) + 30000);
        if (Date.now() >= loadingExpire) {
            throw new Error(`redis server load timeout - try listen ${port}`);
        }
    } while (isListeningPort(port));
    return port;
}

module.exports = RedisServer;