// Created by woodtalk on 2015-05-12.
'use strict';

const FakeIoRedis = require('../index');

const should = require('should');


describe('data specs', () => {
    it('exists', function* () {
        const client = new FakeIoRedis();
        yield client.set('aaa', 'value');

        (yield client.exists('c')).should.be.eql(0);
        (yield client.exists('aaa')).should.be.eql(1);
    });

    it('del', function* () {
        const client = new FakeIoRedis();

        //(function* () {
        //    yield client.del();
        //}).should.throw();

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
        const client = new FakeIoRedis();
        yield client.set('aaa1', 'value');
        yield client.set('aaa2', 'value');
        yield client.set('aaa3', 'value');

        (yield client.exists('aaa1')).should.be.eql(1);
        (yield client.exists('aaa2')).should.be.eql(1);
        (yield client.exists('aaa3')).should.be.eql(1);
        (yield client.keys('*')).should.be.length(3);

        const client2 = new FakeIoRedis();
        (yield client2.del('c')).should.be.eql(0);

        (yield client2.keys('*')).should.be.length(3);

        (yield client2.del('aaa1', 'bbb', 'aaa3')).should.be.eql(2);

        (yield client2.keys('*')).should.be.length(1);
        (yield client2.exists('aaa1')).should.be.eql(0);
        (yield client2.exists('aaa2')).should.be.eql(1);
        (yield client2.exists('aaa3')).should.be.eql(0);
    });

    it('Sets', function* () {
        const client = new FakeIoRedis();

        (yield client.smembers('temp')).should.be.eql([]);

        (yield client.sadd('temp', 'a', 'b')).should.be.eql(2);
        (yield client.smembers('temp')).should.containDeep(['b', 'a']);

        //(function* () {
        //    yield client.set('temp', 's');
        //}).should.throw();

        (yield client.sismember('temp', 'a')).should.be.eql(1);
        (yield client.srem('temp', 'a', 'b')).should.be.eql(2);

        yield client.set('string', 's');
        //(function* () {
        //    yield client.sadd('string', 'aaa');
        //}).should.throw();

        (yield client.sadd('temp', 'a', 'b')).should.be.eql(2);
        (yield client.spop('temp')).should.match(/[ab]/);
        (yield client.scard('temp')).should.be.eql(1);
        (yield client.spop('temp')).should.match(/[ab]/);
        (yield client.scard('temp')).should.be.eql(0);
        should(yield client.spop('temp')).it.is.null();
    });


    it('zset', function* () {
        const client = new FakeIoRedis();

        (yield client.exists('myzset')).should.be.eql(0);

        (yield client.zadd('myzset', 1, 'one')).should.be.eql(1);

        (yield client.zrange('myzset', 0, -1)).should.be.eql(['one']);

        (yield client.zrem('myzset', 'one')).should.be.eql(1);

        (yield client.zrange('myzset', 0, -1)).should.be.eql([]);
        (yield client.exists('myzset')).should.be.eql(0);

        (yield client.zadd('myzset', 1, 'one')).should.be.eql(1);
        (yield client.zadd('myzset', 1, 'one')).should.be.eql(0);
        (yield client.zadd('myzset', 2, 'one')).should.be.eql(0);

        (yield client.zrange('myzset', 0, -1)).should.be.eql(['one']);
        (yield client.zrange('myzset', 0, -1, 'withscores')).should.be.eql(['one', '2']);

        (yield client.zadd('myzset', 3, 'three')).should.be.eql(1);
        (yield client.zadd('myzset', 4, 'four')).should.be.eql(1);

        (yield client.zrange('myzset', 0, -1)).should.be.eql(['one', 'three', 'four']);
        (yield client.zrange('myzset', 0, -1, 'withscores')).should.be.eql(['one', '2', 'three', '3', 'four', '4']);

        (yield client.zrem('myzset', 'one')).should.be.eql(1);

        (yield client.zrange('myzset', 0, -1)).should.be.eql(['three', 'four']);
        (yield client.zrange('myzset', 0, -1, 'withscores')).should.be.eql(['three', '3', 'four', '4']);

        (yield client.zrank('myzset', 'three')).should.be.eql(0);
        (yield client.zrank('myzset', 'four')).should.be.eql(1);
        should(yield client.zrank('myzset', 'one')).it.is.null();

        (yield client.zadd('myzset', 1, 'one')).should.be.eql(1);
        (yield client.zadd('myzset', 2, 'two')).should.be.eql(1);

        (yield client.zrange('myzset', 0, -1)).should.be.eql(['one', 'two', 'three', 'four']);
        (yield client.zrangebyscore('myzset', '-inf', '+inf')).should.be.eql(['one', 'two', 'three', 'four']);
        (yield client.zrangebyscore('myzset', 2, '+inf')).should.be.eql(['two', 'three', 'four']);
        (yield client.zrangebyscore('myzset', 2, 3)).should.be.eql(['two', 'three']);
        (yield client.zrangebyscore('myzset', '(2', 3)).should.be.eql(['three']);
        (yield client.zrangebyscore('myzset', '(2', '3')).should.be.eql(['three']);
        (yield client.zrangebyscore('myzset', '(2', 3, 'withscores')).should.be.eql(['three', '3']);
        (yield client.zrangebyscore('myzset', '(2', '(3')).should.be.eql([]);

        (yield client.zadd('myzset', 1, 'one1', 1, 'one3', 1, 'one2')).should.be.eql(3);
        (yield client.zrange('myzset', 0, -1)).should.be.eql(['one', 'one1', 'one2', 'one3', 'two', 'three', 'four']);
        (yield client.zrange('myzset', 0, -1, 'withscores')).should.be.eql(['one', '1', 'one1', '1', 'one2', '1', 'one3', '1', 'two', '2', 'three', '3', 'four', '4']);
        (yield client.zrangebyscore('myzset', '-inf', '+inf', 'withscores')).should.be.eql(['one', '1', 'one1', '1', 'one2', '1', 'one3', '1', 'two', '2', 'three', '3', 'four', '4']);

        (yield client.zrangebyscore('myzset', '-inf', '+inf', 'limit', 0, 1, 'withscores')).should.be.eql(['one', '1']);
        (yield client.zrangebyscore('myzset', '-inf', '+inf', 'withscores', 'limit', 0, 1)).should.be.eql(['one', '1']);

        //(function* () {
        //    yield client.zrangebyscore('myzset', '-inf', '+inf', 'limit', 'withscores', 0, 1);
        //}).should.throw();

        (yield client.zrange('myzset', 2, 2)).should.be.eql(['one2']);
        (yield client.zrange('myzset', 2, 3)).should.be.eql(['one2', 'one3']);
        (yield client.zrange('myzset', 1, 3)).should.be.eql(['one1', 'one2', 'one3']);
        (yield client.zrange('myzset', 0, 3)).should.be.eql(['one', 'one1', 'one2', 'one3']);
        (yield client.zrange('myzset', 0, 0)).should.be.eql(['one']);
        (yield client.zrange('myzset', 0, 0, 'withscores')).should.be.eql(['one', '1']);
        (yield client.zrange('myzset', 3, 5, 'withscores')).should.be.eql(['one3', '1', 'two', '2', 'three', '3']);

        (yield client.zrange('myzset', 0, -1)).should.be.eql(['one', 'one1', 'one2', 'one3', 'two', 'three', 'four']);

        (yield client.zremrangebyscore('myzset', 1, 1)).should.be.eql(4);

        (yield client.zrange('myzset', 0, -1)).should.be.eql(['two', 'three', 'four']);

        (yield client.zadd('myzset', 1, 'one', 1, 'one1', 1, 'one2')).should.be.eql(3);
        (yield client.zrange('myzset', 0, -1)).should.be.eql(['one', 'one1', 'one2', 'two', 'three', 'four']);

        (yield client.zremrangebyscore('myzset', 1, 2)).should.be.eql(4);

        (yield client.zrange('myzset', 0, -1)).should.be.eql(['three', 'four']);

        (yield client.zadd('myzset', 1, 'one', 1, 'one1', 1, 'one2', 2, 'two')).should.be.eql(4);
        (yield client.zrange('myzset', 0, -1)).should.be.eql(['one', 'one1', 'one2', 'two', 'three', 'four']);

        (yield client.zremrangebyrank('myzset', 1, 2)).should.be.eql(2);

        (yield client.zrange('myzset', 0, -1)).should.be.eql(['one', 'two', 'three', 'four']);
    });

    it('zadd, zrange spec1', function* () {
        (yield (new FakeIoRedis()).zadd('temp', 300, 'userSn', 300, 'userSn2')).should.be.eql(2);
        (yield (new FakeIoRedis()).zrange('temp', 0, -1)).should.be.eql(['userSn', 'userSn2']);

        (yield (new FakeIoRedis()).zadd('temp', 700, 'userSn2')).should.be.eql(0);
        (yield (new FakeIoRedis()).zrange('temp', 0, -1)).should.be.eql(['userSn', 'userSn2']);
    });

    it('zadd, zrange spec2', function* () {
        (yield (new FakeIoRedis()).zadd('temp', 200, 'userSn')).should.be.eql(1);
        (yield (new FakeIoRedis()).zrange('temp', 0, -1)).should.be.eql(['userSn']);

        (yield (new FakeIoRedis()).zadd('temp', 300, 'userSn')).should.be.eql(0);
        (yield (new FakeIoRedis()).zrange('temp', 0, -1)).should.be.eql(['userSn']);

        (yield (new FakeIoRedis()).zadd('temp', 300, 'userSn2')).should.be.eql(1);
        (yield (new FakeIoRedis()).zrange('temp', 0, -1)).should.be.eql(['userSn', 'userSn2']);

        (yield (new FakeIoRedis()).zadd('temp', 700, 'userSn2')).should.be.eql(0);
        (yield (new FakeIoRedis()).zrange('temp', 0, -1)).should.be.eql(['userSn', 'userSn2']);

        (yield (new FakeIoRedis()).zadd('temp', 1000, 'userSn2')).should.be.eql(0);
        (yield (new FakeIoRedis()).zrange('temp', 0, -1)).should.be.eql(['userSn', 'userSn2']);
    });

    it('zadd zrangebyscore spec', function* () {
        yield (new FakeIoRedis()).zadd('temp', 20, 'usersn1');
        yield (new FakeIoRedis()).zadd('temp', 30, 'usersn2');
        yield (new FakeIoRedis()).zadd('temp', 30, 'usersn3');
        yield (new FakeIoRedis()).zadd('temp', 70, 'usersn4');
        yield (new FakeIoRedis()).zadd('temp', 100, 'usersn5');
        yield (new FakeIoRedis()).zadd('temp', 20, 'usersn6');
        yield (new FakeIoRedis()).zadd('temp', 30, 'usersn7');
        yield (new FakeIoRedis()).zadd('temp', 30, 'usersn8');
        yield (new FakeIoRedis()).zadd('temp', 70, 'usersn9');
        yield (new FakeIoRedis()).zadd('temp', 100, 'usersn10');
        yield (new FakeIoRedis()).zadd('temp', 1100, 'usersn11');
        yield (new FakeIoRedis()).zadd('temp', 1120, 'usersn12');

        (yield (new FakeIoRedis()).zrangebyscore('temp', 10, '+inf', 'limit', 0, 10)).should.be.eql(['usersn1', 'usersn6', 'usersn2', 'usersn3', 'usersn7', 'usersn8', 'usersn4', 'usersn9', 'usersn10', 'usersn5']);
    });

    it('empty and get', function* () {
        const client = new FakeIoRedis();

        (yield client.exists('myzset')).should.be.eql(0);

        (yield client.zrangebyscore('myzset', '-inf', '+inf')).should.be.eql([]);
        (yield client.zrange('myzset', 0, -1)).should.be.eql([]);

        (yield client.zrem('myzset', 'aa', 'adfasf')).should.be.eql(0);

        should(yield client.zrank('myzset', 'aa')).it.is.null();

        (yield client.sismember('temp', 'a')).should.be.eql(0);
        (yield client.sismember('temp', 'b')).should.be.eql(0);
        (yield client.scard('temp')).should.be.eql(0);
    });

    afterEach(FakeIoRedis.clear);
});

describe('pubsub specs', () => {
    it('pub/sub', function* () {
        const client = new FakeIoRedis();
        const sub = new FakeIoRedis();

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
        const client = new FakeIoRedis();
        const sub = new FakeIoRedis();

        (yield sub.subscribe('test:gogo:1234')).should.be.eql(1);
        (yield sub.subscribe('test:gogo:1234aa')).should.be.eql(2);
        (yield sub.subscribe('test:gogo:1234')).should.be.eql(2);

        const sub2 = new FakeIoRedis();
        (yield sub2.subscribe('test:gogo:1234')).should.be.eql(1);

        (yield client.publish('test:gogo:1234', 'hello world')).should.be.eql(2);

        (yield sub.unsubscribe('test:gogo:1234')).should.be.eql(1);

        (yield client.publish('test:gogo:1234', 'hello world')).should.be.eql(1);
    });

    it('combo subcribe and psubscribe', function* () {
        const client = new FakeIoRedis();
        const sub = new FakeIoRedis();

        const pmessageResults = [];
        sub.on('pmessage', function (pattern, channel, message) {
            pmessageResults.push({pattern: pattern, channel: channel, message: message});
        });

        const messageResults = [];
        sub.on('message', function (channel, message) {
            messageResults.push({channel: channel, message: message});
        });

        (yield sub.psubscribe('t?st:gogo:1234')).should.be.eql(1);
        (yield sub.psubscribe('test:gogo:1234')).should.be.eql(2);
        (yield sub.psubscribe('test:?ogo:1234aa')).should.be.eql(3);
        (yield sub.psubscribe('test:gogo:*')).should.be.eql(4);
        (yield sub.subscribe('test:gogo:1234aa')).should.be.eql(5);

        const sub2 = new FakeIoRedis();
        (yield sub2.subscribe('test:gogo:1234')).should.be.eql(1);

        (yield client.publish('test:gogo:1234', 'hello world')).should.be.eql(4);

        (yield sub.unsubscribe('test:gogo:1234')).should.be.eql(5);
        (yield client.publish('test:gogo:1234', 'hello world')).should.be.eql(4);

        (yield sub.punsubscribe('test:gogo:1234')).should.be.eql(4);
        (yield client.publish('test:gogo:1234', 'hello world')).should.be.eql(3);

        (pmessageResults).should.be.eql([
            {
                pattern: 't?st:gogo:1234',
                channel: 'test:gogo:1234',
                message: 'hello world'
            },
            {
                pattern: 'test:gogo:1234',
                channel: 'test:gogo:1234',
                message: 'hello world'
            },
            {
                channel: 'test:gogo:1234',
                message: 'hello world',
                pattern: 'test:gogo:*'
            },
            {
                channel: 'test:gogo:1234',
                message: 'hello world',
                pattern: 't?st:gogo:1234'
            },
            {
                channel: 'test:gogo:1234',
                message: 'hello world',
                pattern: 'test:gogo:1234'
            },
            {
                channel: 'test:gogo:1234',
                message: 'hello world',
                pattern: 'test:gogo:*'
            },
            {
                channel: 'test:gogo:1234',
                message: 'hello world',
                pattern: 't?st:gogo:1234'
            },
            {
                channel: 'test:gogo:1234',
                message: 'hello world',
                pattern: 'test:gogo:*'
            }
        ]);

        (messageResults).should.be.length(0);
    });

    it('only psubscribe', function* () {
        const client = new FakeIoRedis();
        const sub = new FakeIoRedis();

        const pmessageResults = [];
        sub.on('pmessage', function (pattern, channel, message) {
            pmessageResults.push({pattern: pattern, channel: channel, message: message});
        });

        const messageResults = [];
        sub.on('message', function (channel, message) {
            messageResults.push({channel: channel, message: message});
        });

        (yield sub.psubscribe('t?st:gogo:1234')).should.be.eql(1);
        (yield sub.psubscribe('test:gogo:1234')).should.be.eql(2);
        (yield sub.psubscribe('test:?ogo:1234aa')).should.be.eql(3);
        (yield sub.psubscribe('test:gogo:*')).should.be.eql(4);

        (yield client.publish('test:gogo:1234', 'hello world')).should.be.eql(3);

        (yield sub.unsubscribe('test:gogo:1234')).should.be.eql(4);
        (yield client.publish('test:gogo:1234', 'hello world')).should.be.eql(3);

        (yield sub.punsubscribe('test:gogo:1234')).should.be.eql(3);
        (yield client.publish('test:gogo:1234', 'hello world')).should.be.eql(2);

        (pmessageResults).should.be.eql([
            {
                pattern: 't?st:gogo:1234',
                channel: 'test:gogo:1234',
                message: 'hello world'
            },
            {
                pattern: 'test:gogo:1234',
                channel: 'test:gogo:1234',
                message: 'hello world'
            },
            {
                channel: 'test:gogo:1234',
                message: 'hello world',
                pattern: 'test:gogo:*'
            },
            {
                channel: 'test:gogo:1234',
                message: 'hello world',
                pattern: 't?st:gogo:1234'
            },
            {
                channel: 'test:gogo:1234',
                message: 'hello world',
                pattern: 'test:gogo:1234'
            },
            {
                channel: 'test:gogo:1234',
                message: 'hello world',
                pattern: 'test:gogo:*'
            },
            {
                channel: 'test:gogo:1234',
                message: 'hello world',
                pattern: 't?st:gogo:1234'
            },
            {
                channel: 'test:gogo:1234',
                message: 'hello world',
                pattern: 'test:gogo:*'
            }
        ]);

        (messageResults).should.be.length(0);
    });

    afterEach(FakeIoRedis.clear);
});
