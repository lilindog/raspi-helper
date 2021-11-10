"use strict";

// 刷卡器的pid，vid
const PID = "2303", VID = "067B", BAUDRATE = 9600;
const { CardReader: CR } = require("../src/index");


!void async function () {
    try {
       await main();
    } catch (err) {
        console.log("出错：");
        console.log(err);
    }
}();

async function main () {
    let index = 0;
    const cr = new CR({ path: "COM8", baudRate: 9600 });
    cr.on("packet", packet => {
        console.log("================================> " + (index++));
        console.log(packet);
        console.log(Array.from(packet.data).reduce((t, c) => {
            t += c.toString(16);
            return t;
        }));
        cr.beep(2, 50, 20);
    });
    await cr.init();
    console.log(await cr.status());
    await cr.setStatus(new CR.Status({ 
        work_mode: 2,
        auto_read_block: 0,
        upload_mode: 0, 
        beep_enable: 0,
        auto_read_mode: 0
    }));
    console.log(await cr.status());
    // await cr.beep(1);
    console.log("end");     
}