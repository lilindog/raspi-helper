"use strict"

const { wifi } = require("../src/index");

const status = wifi.status();
const id = 1;

if (!wifi.status().ip && status.wpa_state !== "COMPLETED") {
    console.log("connecting wifi ...");
    wifi.connect(id);
    console.log("wifi connected!");
    console.log(wifi.status());
} else {
    console.log("wifi connected, disconnecting...");
    wifi.disconnect(id);
    console.log("wifi disconnted!");
    console.log(wifi.status());
}