// Created by woodtalk on 2015-10-05.
'use strict';

class ReplyError extends Error {
    constructor(message) {
        super(message);
        this.message = message;
        this.name = this.constructor.name;
        this.stack = (new Error()).stack;
    }
}

module.exports = ReplyError;
