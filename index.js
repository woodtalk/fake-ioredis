// Created by woodtalk on 2015-05-08.
'use strict';

const subErrMsg = 'Connection in subscriber mode, only subscriber commands may be used';

function getInitMem() {
    return {
        mem: {},
        subscribers: {}
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

class FakeIoRedis {
    constructor(remoteHostKey) {
        this._ = {};
        this._.subchannel = new Set();

        if (!remoteHostKey) {
            remoteHostKey = 'localhost';
        }

        this._.remoteHostKey = remoteHostKey;
        this._.isSubscriber = false;
        this._.callbacks = {
            message: function () {
            }
        };

        this._.clear = function () {
            remoteHosts[remoteHostKey] = getInitMem();
        };

        if ((remoteHostKey in remoteHosts) === false) {
            remoteHosts[remoteHostKey] = getInitMem();
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

        pattern = new RegExp(pattern.replace(/\*/, '.*'));

        const result = [];

        for (var key in remoteHosts[this._.remoteHostKey].mem) {
            if (pattern.test(key) === false) {
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
        if ((channel in remoteHosts[this._.remoteHostKey].subscribers) === false) {
            remoteHosts[this._.remoteHostKey].subscribers[channel] = new Set();
        }

        remoteHosts[this._.remoteHostKey].subscribers[channel].add(this);
        this._.subchannel.add(channel);

        return this._.subchannel.size;
    }

    on(msgType, callback) {
        if (msgType === 'message') {
            this._.callbacks[msgType] = callback;
        }

        return this;
    }

    *publish(channel, value) {
        if ((channel in remoteHosts[this._.remoteHostKey].subscribers) === false) {
            return 0;
        }

        let receiveCount = 0;

        for (let subscriber of remoteHosts[this._.remoteHostKey].subscribers[channel]) {
            subscriber._.callbacks.message(channel, value);
            receiveCount++;

            //if ('pmessage' in subscriber._.callbacks) {
            //    subscriber._.callbacks['pmessage'](channel, value);
            //    receiveCount++;
            //}
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

    *unsubscribe(channel) {
        if ((channel in remoteHosts[this._.remoteHostKey].subscribers)) {
            remoteHosts[this._.remoteHostKey].subscribers[channel].delete(this);
            this._.subchannel.delete(channel);
        }
        return this._.subchannel.size;
    }

    disconnect() {

    }
}

module.exports = FakeIoRedis;
