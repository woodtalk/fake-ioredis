// Created by woodtalk on 2015-05-08.
'use strict';

const subErrMsg = 'Connection in subscriber mode, only subscriber commands may be used';

function getInitMem() {
    return {
        mem: {},
        subscribers: {},
        psubscribers: {}
    }
}

const remoteHosts = {};


// polyfill
Array.from = function (foreachable) {
    const r = [];
    for (let e of foreachable) {
        r.push(e);
    }
    return r;
};

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

    *exists(key) {
        if (typeof key !== 'string') {
            key = key.toString();
        }

        if ((key in remoteHosts[this._.remoteHostKey].mem) === false) {
            return 0;
        }

        return 1;
    }

    *'set'(key, value) {
        if (typeof key !== 'string') {
            key = key.toString();
        }

        if (typeof value !== 'string') {
            value = value.toString();
        }

        remoteHosts[this._.remoteHostKey].mem[key] = value;
        return 'OK';
    }

    *'del'(keys) {
        keys = Array.prototype.slice.call(arguments);

        let r = 0;

        for (let key of keys) {
            if (typeof key === 'string') {
                key = key.toString();
            }

            if ((key in remoteHosts[this._.remoteHostKey].mem) === false) {
                continue;
            }
            delete remoteHosts[this._.remoteHostKey].mem[key];
            r++;
        }

        return r;
    }

    *'get'(key) {
        if (this._.isSubscriber) {
            throw new Error(subErrMsg);
        }

        if (typeof key !== 'string') {
            key = key.toString();
        }

        const result = remoteHosts[this._.remoteHostKey].mem[key];

        if (!result) {
            return null;
        }

        return result;
    }

    *keys(pattern) {
        if (this._.isSubscriber) {
            throw new Error(subErrMsg);
        }

        const result = [];

        for (var key in remoteHosts[this._.remoteHostKey].mem) {
            if (testRedisPattern(pattern, key) === false) {
                continue;
            }

            result.push(key);
        }

        return result;
    }

    *sadd(key, values) {
        if (typeof key !== 'string') {
            key = key.toString();
        }

        values = Array.prototype.slice.call(arguments, 1);

        if ((key in remoteHosts[this._.remoteHostKey].mem) === false) {
            remoteHosts[this._.remoteHostKey].mem[key] = new Set();
        } else if ((remoteHosts[this._.remoteHostKey].mem[key] instanceof Set) === false) {
            throw new Error('ReplyError');
        }

        const oldSize = remoteHosts[this._.remoteHostKey].mem[key].size;

        for (let value of values) {
            if (typeof value === 'string') {
                value = value.toString();
            }
            remoteHosts[this._.remoteHostKey].mem[key].add(value);
        }

        if (oldSize === remoteHosts[this._.remoteHostKey].mem[key].size) {
            return 0;
        }

        return 1;
    }

    *srem(key, values) {
        if (typeof key !== 'string') {
            key = key.toString();
        }
        if ((key in remoteHosts[this._.remoteHostKey].mem) === false) {
            return 0;
        }
        if ((remoteHosts[this._.remoteHostKey].mem[key] instanceof Set) === false) {
            throw new Error('ReplyError');
        }

        values = Array.prototype.slice.call(arguments, 1);

        let r = 0;
        for (let value of values) {
            if (typeof value === 'string') {
                value = value.toString();
            }
            if (remoteHosts[this._.remoteHostKey].mem[key].delete(value)) {
                r++;
            }
        }

        return r;
    }

    *sismember(key, value) {
        if (typeof key !== 'string') {
            key = key.toString();
        }
        if ((key in remoteHosts[this._.remoteHostKey].mem) === false) {
            return 0;
        }
        if ((remoteHosts[this._.remoteHostKey].mem[key] instanceof Set) === false) {
            throw new Error('ReplyError');
        }

        if (typeof value === 'string') {
            value = value.toString();
        }

        if (remoteHosts[this._.remoteHostKey].mem[key].has(value) === false) {
            return 0
        }
        return 1;
    }

    *scard(key) {
        if (typeof key !== 'string') {
            key = key.toString();
        }
        if ((key in remoteHosts[this._.remoteHostKey].mem) === false) {
            return 0;
        }
        if ((remoteHosts[this._.remoteHostKey].mem[key] instanceof Set) === false) {
            throw new Error('ReplyError');
        }

        return remoteHosts[this._.remoteHostKey].mem[key].size;
    }

    *subscribe(channel) {
        this._.isSubscriber = true;

        const myRemote = remoteHosts[this._.remoteHostKey];

        if ((channel in myRemote.subscribers) === false) {
            myRemote.subscribers[channel] = new Set();
        }

        myRemote.subscribers[channel].add(this);
        this._.subchannel.add(channel);

        return this._.subchannel.size + this._.subpattern.size;
    }

    *unsubscribe(channel) {
        const myRemote = remoteHosts[this._.remoteHostKey];

        if ((channel in myRemote.subscribers)) {
            myRemote.subscribers[channel].delete(this);
            this._.subchannel.delete(channel);
        }

        return this._.subchannel.size + this._.subpattern.size;
    }

    *psubscribe(pattern) {
        this._.isSubscriber = true;

        const myRemote = remoteHosts[this._.remoteHostKey];

        if ((pattern in myRemote.psubscribers) === false) {
            myRemote.psubscribers[pattern] = new Set();
        }

        myRemote.psubscribers[pattern].add(this);
        this._.subpattern.add(pattern);

        return this._.subchannel.size + this._.subpattern.size;
    }

    *punsubscribe(pattern) {
        const myRemote = remoteHosts[this._.remoteHostKey];

        if ((pattern in myRemote.psubscribers)) {
            myRemote.psubscribers[pattern].delete(this);
            this._.subpattern.delete(pattern);
        }

        return this._.subchannel.size + this._.subpattern.size;
    }

    on(msgType, callback) {
        if (msgType === 'message') {
            this._.callbacks[msgType] = callback;
        } else if (msgType === 'pmessage') {
            this._.callbacks[msgType] = callback;
        }

        return this;
    }

    *publish(channel, value) {
        const myRemote = remoteHosts[this._.remoteHostKey];

        if ((channel in myRemote.subscribers) === false) {
            return 0;
        }

        let receiveCount = 0;

        for (let subscriber of myRemote.subscribers[channel]) {
            subscriber._.callbacks.message(channel, value);
            receiveCount++;
        }

        for (let pattern in myRemote.psubscribers) {
            for (let psubscriber of myRemote.psubscribers[pattern]) {
                if (testRedisPattern(pattern, channel)) {
                    psubscriber._.callbacks.pmessage(pattern, channel, value);
                    receiveCount++;
                }
            }
        }

        return receiveCount;
    }

    *pubsub(command, arg) {
        if (command.toLowerCase() === 'channels') {
            if (arg === '*') {
                return Object.keys(remoteHosts[this._.remoteHostKey].subscribers);
            }
        }
    }


    disconnect() {

    }
}

module.exports = FakeIoRedis;
