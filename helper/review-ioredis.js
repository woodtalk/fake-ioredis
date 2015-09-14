// Created by woodtalk on 2015-05-12.
'use strict';

const IoRedis = require('ioredis');
const FakeIoRedis = require('../index');


function* review(Client) {
    const client = new Client();

    for (let key of yield client.keys('*')) {
        yield client.del(key);
    }

    try {
        console.log(yield client.sismember('myz', 'a'));
    } catch (e) {
        console.error(e.name);
        console.error(e.stack);
    }

    client.disconnect();
}


const co = require('co');
const sleep = require('co-sleep');

co(function* () {
    console.log('======<real>=======');
    yield review.apply(this, [IoRedis]);

    yield sleep(5);

    console.log();
    console.log();

    console.log('======<fake>=======');
    yield review.apply(this, [FakeIoRedis]);

    process.exit(0);
}).catch(function (e) {
    console.error(e.stack);
    process.exit(-1);
});
