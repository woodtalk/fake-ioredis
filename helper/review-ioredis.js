// Created by woodtalk on 2015-05-12.
'use strict';

const IoRedis = require('ioredis');
const FakeIoRedis = require('../index');


function* review() {
    const client = new (this.creator)();
    const sub = new (this.creator)();

    const r = sub.on('pmessage', function (pattern, channel, message) {
        console.log('sub.on(pmesssage):', pattern, ',', channel, '-> ', message);
    });
    console.log('IoRedis', r instanceof IoRedis, ', FakeIoRedis', r instanceof FakeIoRedis);

    sub.on('message', function (channel, message) {
        console.log('sub.on(messsage):', channel, '-> ', message);
    });

    console.log('psubscribe', yield sub.psubscribe('t?st:gogo:1234'));
    console.log('psubscribe', yield sub.psubscribe('test:gogo:1234'));
    console.log('psubscribe', yield sub.psubscribe('test:?ogo:1234aa'));
    console.log('psubscribe', yield sub.psubscribe('test:gogo:*'));
    console.log('subscribe', yield sub.subscribe('test:gogo:1234aa'));

    const sub2 = new (this.creator)();
    console.log('subscribe2', yield sub2.subscribe('test:gogo:1234'));


    console.log('publish:', yield client.publish('test:gogo:1234', 'hello world'));

    console.log('unsubscribe', yield sub.unsubscribe('test:gogo:1234'));
    console.log('publish:', yield client.publish('test:gogo:1234', 'hello world'));

    console.log('unpsubscribe', yield sub.punsubscribe('test:gogo:1234'));
    console.log('publish:', yield client.publish('test:gogo:1234', 'hello world'));

    client.disconnect();
    sub.disconnect();
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
