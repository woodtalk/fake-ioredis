// Created by woodtalk on 2015-05-12.
'use strict';

const co = require('co');
const IoRedis = require('ioredis');
const FakeIoRedis = require('./index');

const sleep = require('co-sleep');

co(function* () {
    const c = new IoRedis();
    console.log(yield c.keys('*'));
    console.log(yield c.pubsub('CHANNELS', '*'));
    console.log();

    this.client = new IoRedis();
    this.sub = new IoRedis();
    this.creator = IoRedis;

    yield test;

    yield sleep(5);

    console.log();
    console.log('===================');
    console.log('======<fake>=======');
    console.log();

    this.client = new FakeIoRedis();
    this.sub = new FakeIoRedis();
    this.creator = FakeIoRedis;
    yield test;

    process.exit(0);
}).catch(function (e) {
    console.error(e.stack);
    process.exit(-1);
});

function* test() {
    const client = this.client;
    const sub = this.sub;

    const r = sub.on('message', function (channel, message) {
        console.log('sub.on(messsage):', channel, '-> ', message);
    });
    console.log('subscribe', yield sub.subscribe('test:gogo:1234'));
    console.log('subscribe', yield sub.subscribe('test:gogo:1234aa'));
    console.log('subscribe', yield sub.subscribe('test:gogo:1234'));
    const sub2 = new this.creator();
    console.log('subscribe2', yield sub2.subscribe('test:gogo:1234'));

    console.log('IoRedis', r instanceof IoRedis, ', FakeIoRedis', r instanceof FakeIoRedis);

    console.log('publish:', yield client.publish('test:gogo:1234', 'hello world'));

    console.log('unsubscribe', yield sub.unsubscribe('test:gogo:1234'));

    console.log('publish:', yield client.publish('test:gogo:1234', 'hello world'));

    client.disconnect();
    sub.disconnect();
};

