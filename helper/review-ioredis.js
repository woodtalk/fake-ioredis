// Created by woodtalk on 2015-05-12.
'use strict';

const IoRedis = require('ioredis');
const FakeIoRedis = require('../index');


function* review() {
    const client = new (this.creator)();

    yield client.del('myzset');

    console.log(yield client.zadd('myzset', 1, 'one'));
    console.log(yield client.zadd('myzset', 1, 'one'));
    console.log(yield client.zadd('myzset', 2, 'one'));

    console.log(yield client.zrange('myzset', 0, -1));
    console.log(yield client.zrange('myzset', 0, -1, 'withscores'));

    console.log(yield client.zadd('myzset', 3, 'three'));
    console.log(yield client.zadd('myzset', 4, 'four'));

    console.log(yield client.zrange('myzset', 0, -1));
    console.log(yield client.zrange('myzset', 0, -1, 'withscores'));

    console.log(yield client.zrem('myzset', 'one'));

    console.log(yield client.zrange('myzset', 0, -1));
    console.log(yield client.zrange('myzset', 0, -1, 'withscores'));

    console.log(yield client.zrank('myzset', 'three'));
    console.log(yield client.zrank('myzset', 'four'));
    console.log(yield client.zrank('myzset', 'one'));

    console.log(yield client.zadd('myzset', 1, 'one'));
    console.log(yield client.zadd('myzset', 2, 'two'));

    console.log(yield client.zrange('myzset', 0, -1));
    console.log(yield client.zrangebyscore('myzset', '-inf', '+inf'));
    console.log(yield client.zrangebyscore('myzset', 2, '+inf'));
    console.log(yield client.zrangebyscore('myzset', 2, 3));
    console.log(yield client.zrangebyscore('myzset', '(2', 3));
    console.log(yield client.zrangebyscore('myzset', '(2', '3'));
    console.log(yield client.zrangebyscore('myzset', '(2', '(3'));
    console.log(yield client.zrangebyscore('myzset', '(2', 3, 'withscores'));

    console.log(yield client.zadd('myzset', 1, 'one1', 1, 'one2', 1, 'one2'));
    console.log(yield client.zrange('myzset', 0, -1));
    console.log(yield client.zrange('myzset', 0, -1, 'withscores'));

    console.log(yield client.zrange('myzset', 2, 2));
    console.log(yield client.zrange('myzset', 2, 3));
    console.log(yield client.zrange('myzset', 1, 3));
    console.log(yield client.zrange('myzset', 0, 3));
    console.log(yield client.zrange('myzset', 0, 0));
    console.log(yield client.zrange('myzset', 0, 0, 'withscores'));

    console.log(yield client.zrange('myzset', 0, -1));

    console.log(yield client.zremrangebyscore('myzset', 1, 1));

    console.log(yield client.zrange('myzset', 0, -1));

    console.log(yield client.zadd('myzset', 1, 'one', 1, 'one1', 1, 'one2'));
    console.log(yield client.zrange('myzset', 0, -1));

    console.log(yield client.zremrangebyscore('myzset', 1, 2));

    console.log(yield client.zrange('myzset', 0, -1));

    console.log(yield client.zadd('myzset', 1, 'one', 1, 'one1', 1, 'one2', 2, 'two'));
    console.log(yield client.zrange('myzset', 0, -1));

    console.log(yield client.zremrangebyrank('myzset', 1, 2));

    console.log(yield client.zrange('myzset', 0, -1));

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
