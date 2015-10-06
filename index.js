// Created by woodtalk on 2015-05-08.
'use strict';

const subErrMsg = 'Connection in subscriber mode, only subscriber commands may be used';
const typeErrMsg = 'WRONGTYPE Operation against a key holding the wrong kind of value';
const valueErrMsg = 'ERR value is not a valid float';
const syntaxErrMsg = 'ERR syntax error';
const wrongNumberArgumentErrMsg = methodName => `ERR wrong number of arguments for '${methodName}' command`;

const ReplyError = require('./ReplyError');

function getInitMem() {
    return {
        mem: {},
        meta: {},
        subscribers: {},
        psubscribers: {}
    }
}

const remoteHosts = {};


function testRedisPattern(pattern, channel) {
    const rex = new RegExp(pattern.replace('?', '.').replace('*', '.*'));
    return (rex).test(channel);
}

class FakeIoRedis {
    constructor(remoteHostKey) {
        this._ = {};
        this._.subchannel = new Set();
        this._.subpattern = new Set();
        this._.callbacks = {
            message: function () {
            },
            pmessage: function () {
            }
        };

        if (!remoteHostKey) {
            remoteHostKey = 'localhost';
        }

        this._.remoteHostKey = remoteHostKey;
        this._.isSubscriber = false;

        this._.clear = function () {
            remoteHosts[remoteHostKey] = getInitMem();
        };

        if ((remoteHostKey in remoteHosts) === false) {
            this._.clear();
        }
    }

    exists(key) {
        if (typeof key !== 'string') {
            key = key.toString();
        }

        if (!remoteHosts[this._.remoteHostKey].meta.hasOwnProperty(key)) {
            return Promise.resolve(0);
        }

        return Promise.resolve(1);
    }

    ['set'](key, value) {
        if (typeof key !== 'string') {
            key = key.toString();
        }

        const remoteHost = remoteHosts[this._.remoteHostKey];

        if (remoteHost.meta.hasOwnProperty(key) && remoteHost.meta[key] !== 'string') {
            throw new ReplyError(typeErrMsg);
        }

        if (typeof value !== 'string') {
            value = value.toString();
        }

        remoteHost.mem[key] = value;
        remoteHost.meta[key] = 'string';

        return Promise.resolve('OK');
    }

    ['del'](keys) {
        keys = Array.from(arguments);
        if (keys.length === 0) {
            throw new ReplyError(wrongNumberArgumentErrMsg('del'));
        }

        let r = 0;

        for (let key of keys) {
            if (typeof key !== 'string') {
                key = key.toString();
            }

            if (!remoteHosts[this._.remoteHostKey].meta.hasOwnProperty(key)) {
                continue;
            }

            delete remoteHosts[this._.remoteHostKey].mem[key];
            delete remoteHosts[this._.remoteHostKey].meta[key];
            r++;
        }

        return Promise.resolve(r);
    }

    ['get'](key) {
        if (this._.isSubscriber) {
            throw new ReplyError(subErrMsg);
        }

        if (typeof key !== 'string') {
            key = key.toString();
        }

        const result = remoteHosts[this._.remoteHostKey].mem[key];

        if (!result) {
            return Promise.resolve(null);
        }

        return Promise.resolve(result);
    }

    keys(pattern) {
        if (this._.isSubscriber) {
            throw new ReplyError(subErrMsg);
        }

        const result = [];

        for (let key in remoteHosts[this._.remoteHostKey].mem) {
            if (testRedisPattern(pattern, key) === false) {
                continue;
            }

            result.push(key);
        }

        return Promise.resolve(result);
    }

    sadd(key, values) {
        if (typeof key !== 'string') {
            key = key.toString();
        }

        const mem = remoteHosts[this._.remoteHostKey].mem;
        const meta = remoteHosts[this._.remoteHostKey].meta;

        if (!mem.hasOwnProperty(key)) {
            mem[key] = new Set();
            meta[key] = 'set';
        }
        if (meta[key] !== 'set') {
            throw new ReplyError(typeErrMsg);
        }

        const setData = mem[key];

        values = parseValues(arguments);

        let r = 0;
        for (let value of values) {
            if (typeof value !== 'string') {
                value = value.toString();
            }
            if (!setData.has(value)) {
                r++;
            }
            setData.add(value);
        }

        return Promise.resolve(r);
    }

    srem(key, values) {
        if (typeof key !== 'string') {
            key = key.toString();
        }
        values = parseValues(arguments);
        if (values.length === 0) {
            throw new ReplyError(wrongNumberArgumentErrMsg('srem'));
        }
        const remoteHost = remoteHosts[this._.remoteHostKey];
        if (remoteHost.mem.hasOwnProperty(key) === false) {
            return Promise.resolve(0);
        }
        if (remoteHost.meta[key] !== 'set') {
            throw new ReplyError(typeErrMsg);
        }

        let r = 0;
        for (let value of values) {
            if (typeof value !== 'string') {
                value = value.toString();
            }
            if (remoteHost.mem[key].delete(value)) {
                r++;
            }
        }

        if (remoteHost.mem[key].size === 0) {
            delete remoteHost.mem[key];
            delete remoteHost.meta[key];
        }

        return Promise.resolve(r);
    }

    sismember(key, value) {
        if (typeof key !== 'string') {
            key = key.toString();
        }
        const remoteHost = remoteHosts[this._.remoteHostKey];
        if (remoteHost.meta[key] === void 0) {
            return Promise.resolve(0);
        }
        if (remoteHost.meta[key] !== 'set') {
            throw new ReplyError(typeErrMsg);
        }

        if (typeof value !== 'string') {
            value = value.toString();
        }

        if (remoteHost.mem[key].has(value) === false) {
            return Promise.resolve(0);
        }
        return Promise.resolve(1);
    }

    spop(key) {
        if (typeof key !== 'string') {
            key = key.toString();
        }
        const mem = remoteHosts[this._.remoteHostKey].mem[key];
        if (mem === void 0) {
            return Promise.resolve(null);
        }
        if (remoteHosts[this._.remoteHostKey].meta[key] !== 'set') {
            throw new ReplyError(typeErrMsg);
        }

        const r = Array.from(mem)[Math.floor(Math.random() * (mem.size - 1))];
        return this.srem(key, r)
            //.then(() => r);
            .then(value => value === 0 ? null : r);
    }

    smembers(key) {
        if (typeof key !== 'string') {
            key = key.toString();
        }
        const mem = remoteHosts[this._.remoteHostKey].mem[key];
        if (mem === void 0) {
            return Promise.resolve([]);
        }
        if (remoteHosts[this._.remoteHostKey].meta[key] !== 'set') {
            throw new ReplyError(typeErrMsg);
        }

        return Promise.resolve(Array.from(mem));
    }

    scard(key) {
        return this.smembers(key)
            .then(r => r.length);
    }

    subscribe(channel) {
        this._.isSubscriber = true;

        const myRemote = remoteHosts[this._.remoteHostKey];

        if ((channel in myRemote.subscribers) === false) {
            myRemote.subscribers[channel] = new Set();
        }

        myRemote.subscribers[channel].add(this);
        this._.subchannel.add(channel);

        return Promise.resolve(this._.subchannel.size + this._.subpattern.size);
    }

    unsubscribe(channel) {
        const myRemote = remoteHosts[this._.remoteHostKey];

        if ((channel in myRemote.subscribers)) {
            myRemote.subscribers[channel].delete(this);
            this._.subchannel.delete(channel);
        }

        return Promise.resolve(this._.subchannel.size + this._.subpattern.size);
    }

    psubscribe(pattern) {
        this._.isSubscriber = true;

        const myRemote = remoteHosts[this._.remoteHostKey];

        if ((pattern in myRemote.psubscribers) === false) {
            myRemote.psubscribers[pattern] = new Set();
        }

        myRemote.psubscribers[pattern].add(this);
        this._.subpattern.add(pattern);

        return Promise.resolve(this._.subchannel.size + this._.subpattern.size);
    }

    punsubscribe(pattern) {
        const myRemote = remoteHosts[this._.remoteHostKey];

        if ((pattern in myRemote.psubscribers)) {
            myRemote.psubscribers[pattern].delete(this);
            this._.subpattern.delete(pattern);
        }

        return Promise.resolve(this._.subchannel.size + this._.subpattern.size);
    }

    on(msgType, callback) {
        if (msgType === 'message') {
            this._.callbacks[msgType] = callback;
        } else if (msgType === 'pmessage') {
            this._.callbacks[msgType] = callback;
        }

        return this;
    }

    publish(channel, value) {
        const myRemote = remoteHosts[this._.remoteHostKey];

        let receiveCount = 0;

        if (channel in myRemote.subscribers) {
            for (let subscriber of myRemote.subscribers[channel]) {
                subscriber._.callbacks.message(channel, value);
                receiveCount++;
            }
        }

        for (let pattern in myRemote.psubscribers) {
            for (let psubscriber of myRemote.psubscribers[pattern]) {
                if (testRedisPattern(pattern, channel)) {
                    psubscriber._.callbacks.pmessage(pattern, channel, value);
                    receiveCount++;
                }
            }
        }

        return Promise.resolve(receiveCount);
    }

    pubsub(command, arg) {
        if (command.toLowerCase() === 'channels') {
            if (arg === '*') {
                return Promise.resolve(Object.keys(remoteHosts[this._.remoteHostKey].subscribers));
            }
        }
    }

    zadd(key, values) {
        values = parseValues(arguments);
        if (values.length % 2 !== 0) {
            throw new ReplyError(syntaxErrMsg);
        }

        const valueScorePairs = new Map();
        for (let i = 0; i < values.length; i += 2) {
            let score = values[i];
            if (typeof score !== 'string') {
                score = score.toString();
            }

            let value = values[i + 1];
            if (typeof value !== 'string') {
                value = value.toString();
            }

            valueScorePairs.set(value, score);
        }

        const remoteHost = remoteHosts[this._.remoteHostKey];
        if (!remoteHost.mem.hasOwnProperty(key)) {
            remoteHost.mem[key] = {
                scores: new Map(),
                valueArrays: new Map()
            };
            remoteHost.meta[key] = 'zset';
        }

        if (remoteHost.meta[key] !== 'zset') {
            throw new ReplyError(typeErrMsg);
        }

        const mem = remoteHost.mem[key];

        let r = 0;
        for (let pair of valueScorePairs) {
            let value = pair[0];
            let score = pair[1];

            if (!mem.scores.has(value)) {
                r++;
            } else {
                const oldScore = mem.scores.get(value);

                const valueArray = mem.valueArrays.get(oldScore);
                valueArray.splice(valueArray.indexOf(value), 1);
                if (valueArray.length === 0) {
                    mem.valueArrays.delete(oldScore);
                }
            }

            mem.scores.set(value, score);

            if (!mem.valueArrays.has(score)) {
                mem.valueArrays.set(score, []);
            }

            const oldArray = mem.valueArrays.get(score);
            oldArray.push(value);
            oldArray.sort((x, y) => x.toString() < y.toString() ? -1 : 1);
        }

        return Promise.resolve(r);
    }

    zrange(key, start, end, withscores) {
        const remoteHost = remoteHosts[this._.remoteHostKey];
        if (remoteHost.meta[key] === void 0) {
            return Promise.resolve([]);
        }
        if (remoteHost.meta[key] !== 'zset') {
            throw new ReplyError(typeErrMsg);
        }
        const mem = remoteHost.mem[key];

        const scores = [];
        for (let v of mem.valueArrays.keys()) {
            scores.push(v);
        }
        scores.sort((x, y) => parseInt(x) < parseInt(y) ? -1 : 1);

        let r = [];
        for (let score of scores) {
            for (let value of mem.valueArrays.get(score)) {
                r.push(value);
                if (withscores === 'withscores') {
                    r.push('' + score);
                }
            }
        }

        let realEnd = end + 1;
        if (withscores === 'withscores') {
            if (end !== -1) {
                realEnd *= 2;
            }
            start *= 2;
        }

        return Promise.resolve(r.slice(start, end === -1 ? void 0 : realEnd));
    }

    zrangebyscore(key, start, end, options) {
        const remoteHost = remoteHosts[this._.remoteHostKey];
        if (remoteHost.meta[key] === void 0) {
            return Promise.resolve([]);
        }
        if (remoteHost.meta[key] !== 'zset') {
            throw new ReplyError(typeErrMsg);
        }
        const mem = remoteHost.mem[key];

        const scores = [];
        for (let s of mem.valueArrays.keys()) {
            scores.push(s);
        }
        scores.sort((x, y) => parseInt(x) < parseInt(y) ? -1 : 1);

        start = start === '-inf' ? scores[0] : start;
        end = end === '+inf' ? scores[scores.length - 1] : end;

        start = start.toString().startsWith('(') ? +start.toString().slice(1) + 1 : start;
        end = end.toString().startsWith('(') ? +end.toString().slice(1) - 1 : end;

        start = +start;
        end = +end;


        let realStart = null;
        for (let s of scores) {
            if (s >= start) {
                realStart = s;
                break;
            }
        }
        if (realStart === null) {
            throw new Error();
        }
        start = realStart;

        let realEnd = null;
        for (let s of scores.reverse()) {
            if (s <= end) {
                realEnd = s;
                break;
            }
        }
        scores.reverse();
        if (realEnd === null) {
            throw new Error();
        }
        end = realEnd;

        options = Array.prototype.slice.call(arguments, this.zrangebyscore.length - 1);
        let withscores = null;
        let offset = null;
        let count = null;
        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            if (option === 'withscores') {
                withscores = option;
                continue;
            }

            if (option === 'limit') {
                if (options.length - i < 2) {
                    throw new ReplyError(syntaxErrMsg);
                }

                offset = +options[++i];
                count = +options[++i];

                if (isNaN(offset)) {
                    throw new ReplyError(syntaxErrMsg);
                }

                if (isNaN(count)) {
                    throw new ReplyError(syntaxErrMsg);
                }
            }
        }

        let r = [];
        for (let s of scores.slice(scores.indexOf(start), scores.indexOf(end) + 1)) {
            for (let v of mem.valueArrays.get(s)) {
                r.push(v);
                if (withscores === 'withscores') {
                    r.push('' + s);
                }
            }
        }

        if (offset === null) {
            return Promise.resolve(r);
        }
        if (withscores === 'withscores') {
            r = r.slice(offset * 2, (offset + count) * 2);
        } else {
            r = r.slice(offset, offset + count);
        }

        return Promise.resolve(r);
    }

    zrank(key, value) {
        const remoteHost = remoteHosts[this._.remoteHostKey];
        if (remoteHost.meta[key] === void 0) {
            return Promise.resolve(null);
        }
        if (remoteHost.meta[key] !== 'zset') {
            throw new ReplyError(typeErrMsg);
        }
        const mem = remoteHost.mem[key];

        if (typeof value !== 'string') {
            value = value.toString();
        }

        const score = mem.scores.get(value);
        if (!score) {
            return Promise.resolve(null);
        }

        let rank = 0;
        for (let pair of mem.valueArrays) {
            let s = pair[0];
            let valueArray = pair[1];
            if (s === score) {
                rank += valueArray.indexOf(value);
                break;
            }

            rank += valueArray.length;
        }

        return Promise.resolve(rank);
    }

    zrem(key, values) {
        const remoteHost = remoteHosts[this._.remoteHostKey];
        if (remoteHost.meta[key] === void 0) {
            return Promise.resolve(0);
        }
        if (remoteHost.meta[key] !== 'zset') {
            throw new ReplyError(typeErrMsg);
        }
        const mem = remoteHost.mem[key];

        values = parseValues(arguments);

        let r = 0;
        for (let value of values) {
            if (typeof value !== 'string') {
                value = value.toString();
            }

            if (mem.scores.has(value)) {
                const score = mem.scores.get(value);
                mem.scores.delete(value);

                const valueArray = mem.valueArrays.get(score);
                valueArray.splice(valueArray.indexOf(value), 1);
                if (valueArray.length !== 0) {
                    mem.valueArrays.set(score, valueArray);
                } else {
                    mem.valueArrays.delete(score);
                }

                r++;
            }
        }

        if (mem.scores.size === 0) {
            delete remoteHost.mem[key];
            delete remoteHost.meta[key];
        }

        return Promise.resolve(r);
    }

    zremrangebyscore(key, start, end) {
        return this.zrangebyscore(key, start, end)
            .then(values => this.zrem.apply(this, [key].concat(values)));
    }

    zremrangebyrank(key, start, end) {
        return this.zrange(key, start, end)
            .then(values => this.zrem.apply(this, [key].concat(values)));
    }

    disconnect() {
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
