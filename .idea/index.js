// Created by woodtalk on 2015-05-08.
'use strict';

class FakeIoRedis {
    constructor() {
        this.mem = {}
    }

    *exists(key) {
        return (!this.mem[key]) === false;
    }

    *'set'(key, value) {
        if (typeof value !== 'string') {
            value = value.toString();
        }

        this.mem[key] = value;
        return 'OK';
    }

    *'get'(key) {
        const result = this.mem[key];

        if (!result) {
            return null;
        }

        return result;
    }

    *keys(pattern) {
        pattern = new RegExp(pattern.replace(/\*/, '.*'));

        const result = [];

        for (var key in this.mem) {
            if (pattern.test(key) == false) {
                continue;
            }

            result.push(key);
        }

        return result;
    }
}

module.exports = FakeIoRedis;
