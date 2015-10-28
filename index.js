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
        const cli = new FakeIoRedis(server.port);
        return cli.pubsub('channels', '*').then(r => {
            if (r.length === 0) {
                return cli.flushall();
            }

            server.kill();
            server = new RedisServer();
        });
    }
}

module.exports = FakeIoRedis;
