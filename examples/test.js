"use strict"

const { wifi } = require("../src/index");

if (!wifi.status().ip) {
    console.log("连接wifi...");
    wifi.connect(2);
    console.log("已连接...");
    console.log(wifi.status());
} else {
    console.log("已有wifi连接，正在断开...");
    wifi.disconnect(2);
    console.log("已断开...");
    console.log(wifi.status());
}