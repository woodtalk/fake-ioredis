// Created by woodtalk on 2015-05-12.
'use strict';

const IoRedis = require('ioredis');
const FakeIoRedis = require('../index');


function* review(Client) {
    const client = new Client();

    for (let key of yield client.keys('*')) {
        yield client.del(key);
    }

    yield (new Client()).zadd('temp', 20, 'usersn1');
    yield (new Client()).zadd('temp', 30, 'usersn2');
    yield (new Client()).zadd('temp', 30, 'usersn3');
    yield (new Client()).zadd('temp', 70, 'usersn4');
    yield (new Client()).zadd('temp', 100, 'usersn5');
    yield (new Client()).zadd('temp', 20, 'usersn6');
    yield (new Client()).zadd('temp', 30, 'usersn7');
    yield (new Client()).zadd('temp', 30, 'usersn8');
    yield (new Client()).zadd('temp', 70, 'usersn9');
    yield (new Client()).zadd('temp', 100, 'usersn10');
    yield (new Client()).zadd('temp', 1100, 'usersn11');
    yield (new Client()).zadd('temp', 1120, 'usersn12');

    console.log(yield (new Client()).zrangebyscore('temp', 10, '+inf', 'limit', 0, 10, 'withscores'));
    //.should.be.eql(['usersn1', 'usersn6', 'usersn2', 'usersn3', 'usersn7', 'usersn8', 'usersn4', 'usersn9', 'usersn10', 'usersn5']);

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
