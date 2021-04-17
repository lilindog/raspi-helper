"use strict";

const { execSync } = require("child_process");
const { mkdirSync, existsSync } = require("fs");
const { defaultText2Sound } = require("./lib");

/**
 * 文本发音，将文本转语音播放出来
 * 
 * @param {String}  text
 * @param {defaultText2Sound.Option|Function} value
 */
exports.say = async (text, value) => {
    let buf = null;
    if (typeof value === "function") {
        buf = await value();
        if (!(stream instanceof Buffer)) throw "say 传入的自定义 text2Sound 函数返回值必须为 Buffer!";
    } else {
        buf = defaultText2Sound(text, value);
    }
    // console.log(buf);
    // if (!execSync("__dirname" + "/temp")) mkdirSync(__dirname + "/temp");
    // fstat.writeSync()
}
exports.say.defaultText2Sound = defaultText2Sound;