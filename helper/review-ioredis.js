// Created by woodtalk on 2015-05-12.
'use strict';

const IoRedis = require('ioredis');
const FakeIoRedis = require('../index');


function* review() {
    const client = new (this.creator)();

    try {
        yield client.zadd('string', 0, 'y', 0);
    } catch (e) {
        console.log(e.name);
        console.error(e.stack);
    }

    client.disconnect();
}


const co = require('co');
const sleep = require('co-sleep');

co(function* () {
    console.log('======<real>=======');
    this.creator = IoRedis;
    yield review;

    yield sleep(5);

    console.log();
    console.log();

    console.log('======<fake>=======');
    this.creator = FakeIoRedis;
    yield review;

    process.exit(0);
}).catch(function (e) {
    console.error(e.stack);
    process.exit(-1);
});
