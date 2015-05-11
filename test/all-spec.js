// Created by woodtalk on 2015-05-12.
'use strict';

const FakeIoRedis = require('./../index');

const hostkeys = [undefined, 'test'];

describe('test', function () {
    for (let hostkey of hostkeys) {
        it('key?', function* () {
            const client = new FakeIoRedis(hostkey);
            yield client.set('aaa', 'value');

            (yield client.exists('c')).should.be.eql(0);
            (yield client.exists('aaa')).should.be.eql(1);
        });

        it('del', function* () {
            const client = new FakeIoRedis(hostkey);
            yield client.set('aaa1', 'value');
            yield client.set('aaa2', 'value');
            yield client.set('aaa3', 'value');

            (yield client.exists('aaa1')).should.be.eql(1);
            (yield client.exists('aaa2')).should.be.eql(1);
            (yield client.exists('aaa3')).should.be.eql(1);
            (yield client.keys('*')).should.be.length(3);

            (yield client.del('c')).should.be.eql(0);

            (yield client.keys('*')).should.be.length(3);

            (yield client.del('aaa1', 'bbb', 'aaa3')).should.be.eql(2);

            (yield client.keys('*')).should.be.length(1);
            (yield client.exists('aaa1')).should.be.eql(0);
            (yield client.exists('aaa2')).should.be.eql(1);
            (yield client.exists('aaa3')).should.be.eql(0);
        });

        it('del client 2', function* () {
            const client = new FakeIoRedis(hostkey);
            yield client.set('aaa1', 'value');
            yield client.set('aaa2', 'value');
            yield client.set('aaa3', 'value');

            (yield client.exists('aaa1')).should.be.eql(1);
            (yield client.exists('aaa2')).should.be.eql(1);
            (yield client.exists('aaa3')).should.be.eql(1);
            (yield client.keys('*')).should.be.length(3);

            const client2 = new FakeIoRedis(hostkey);
            (yield client2.del('c')).should.be.eql(0);

            (yield client2.keys('*')).should.be.length(3);

            (yield client2.del('aaa1', 'bbb', 'aaa3')).should.be.eql(2);

            (yield client2.keys('*')).should.be.length(1);
            (yield client2.exists('aaa1')).should.be.eql(0);
            (yield client2.exists('aaa2')).should.be.eql(1);
            (yield client2.exists('aaa3')).should.be.eql(0);
        });

        it('Sets', function* () {
            const client = new FakeIoRedis(hostkey);

            (yield client.sismember('temp', 'a', 'b')).should.be.eql(0);
            (yield client.sadd('temp', 'a', 'b')).should.be.eql(1);
            (yield client.sismember('temp', 'a')).should.be.eql(1);
            (yield client.srem('temp', 'a', 'b')).should.be.eql(2);
        });

        it('pub/sub', function* () {
            const client = new FakeIoRedis(hostkey);
            const sub = new FakeIoRedis(hostkey);

            (yield client.pubsub('CHANNELS', '*')).should.be.eql([]);

            (yield sub.subscribe('test:gogo:1234')).should.be.eql(1);

            const r = sub.on('message', function (channel, message) {
                (channel).should.be.eql('test:gogo:1234');
                (message).should.be.eql('hello world');
            });
            (r).should.be.instanceof(FakeIoRedis);

            (yield client.publish('test:gogo:1234', 'hello world')).should.be.eql(1);

            (yield client.pubsub('CHANNELS', '*')).should.be.eql(['test:gogo:1234']);
        });

        it('unsubscribe', function* () {
            const client = new FakeIoRedis(hostkey);
            const sub = new FakeIoRedis(hostkey);

            sub.on('message', function () {
            });
            (yield sub.subscribe('test:gogo:1234')).should.be.eql(1);
            (yield sub.subscribe('test:gogo:1234aa')).should.be.eql(2);
            (yield sub.subscribe('test:gogo:1234')).should.be.eql(2);
            const sub2 = new FakeIoRedis(hostkey);
            (yield sub2.subscribe('test:gogo:1234')).should.be.eql(1);

            (yield client.publish('test:gogo:1234', 'hello world')).should.be.eql(2);

            (yield sub.unsubscribe('test:gogo:1234')).should.be.eql(1);

            (yield client.publish('test:gogo:1234', 'hello world')).should.be.eql(1);
        });
    }

    afterEach(function* () {
        for (let hostkey of hostkeys) {
            const client = new FakeIoRedis(hostkey);
            client._.clear();
        }
    });
});
