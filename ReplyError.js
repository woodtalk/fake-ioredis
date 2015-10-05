// Created by woodtalk on 2015-10-05.
'use strict';

class ReplyError extends Error {
    constructor(message) {
        super(message);

        this.message = message;
        super.name = 'ReplyError';
    }
}

module.exports = ReplyError;
