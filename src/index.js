"use strict";

const 
    wifi = require("./packages/wifi/index"),
    say = require("./packages/say/index"),
    CardReader = require("./packages/card-reader/index");

module.exports = Object.assign(Object.create(null), {
    wifi,
    say,
    CardReader
});