"use strict";

const 
    wifi = require("./packages/wifi/index"),
    say = require("./packages/say/index"),
    CardReader = require("./packages/card-reader/index");

module.exports = Object.create(null, {
    wifi: {
        value: wifi
    },
    say: {
        value: say
    },
    CardReader: {
        value: CardReader
    }
});