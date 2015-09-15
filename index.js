// Created by woodtalk on 2015-05-08.
'use strict';

const IoRedis = require('ioredis');
const RedisServer = require('./RedisServer');

let server = new RedisServer();


class FakeIoRedis extends IoRedis {
    constructor() {
        super(server.port);
    }

    static clear() {
        server.kill();
        server = new RedisServer();

    }

    static fastClear() {
        const cli = new FakeIoRedis(server.port);
        return cli.flushall();
    }
}

module.exports = FakeIoRedis;
