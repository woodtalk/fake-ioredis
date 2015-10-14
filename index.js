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

function parseValues(args) {
    let values = Array.from(args);
    values = values.slice(1, values.length);
    if (values.length === 1 && values[0] === void 0) {
        values = [];
    }
    return values;
}

module.exports = FakeIoRedis;
