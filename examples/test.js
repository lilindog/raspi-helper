"use strict"

const { wifi, say } = require("../src/index");

!async function () {
    await say.say("你好", new say.say.defaultText2Sound.Option({ sescretId: "AKID44pO5VuY9TCg2KLOAujkYFbv8E3SMR4I", sescretKey: "J9k51nSinrWuWN6bstEJAmwpOhv6wOZc" }));
}();

// const status = wifi.status();
// const id = 1;

// if (!wifi.status().ip && status.wpa_state !== "COMPLETED") {
//     console.log("connecting wifi ...");
//     wifi.connect(id);
//     console.log("wifi connected!");
//     console.log(wifi.status());
// } else {
//     console.log("wifi connected, disconnecting...");
//     wifi.disconnect(id);
//     console.log("wifi disconnted!");
//     console.log(wifi.status());
// }