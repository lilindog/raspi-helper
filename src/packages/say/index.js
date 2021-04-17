"use strict";

const { execSync } = require("child_process");
const { mkdirSync, existsSync, writeFileSync } = require("fs");
const { defaultText2Sound } = require("./lib");
const path = require("path");

/**
 * 文本发音，将文本转语音播放出来
 * 
 * @param {String}  text
 * @param {defaultText2Sound.Option|Function} value
 */
exports.say = async (text, value) => {
    const 
        tempDir = path.resolve(__dirname, "temp"),
        filePath = path.resolve(tempDir, text + ".wav");
    if (existsSync(filePath)) {
        return play();
    }
    let buf = null;
    if (typeof value === "function") {
        buf = await value();
        if (!(buf instanceof Buffer)) throw "say 传入的自定义 text2Sound 函数返回值必须为 Buffer!";
    } else {
        buf = defaultText2Sound(text, value);
    }
    if (!execSync(tempDir)) mkdirSync(tempDir);
    writeFileSync(buf, filePath);
    play();
    function play () {
        try {
            execSync(`sox -v 1 ${tempDir}/${filePath}`);
        } catch (err) {
            throw "没有安装 sox，无法执行播放！";
        }
    }
};
exports.say.defaultText2Sound = defaultText2Sound;