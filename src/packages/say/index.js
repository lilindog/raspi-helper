"use strict";

const { exec } = require("child_process");
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
        buf = await defaultText2Sound(text, value);
    }
    if (!existsSync(tempDir)) mkdirSync(tempDir);
    writeFileSync(filePath, buf);
    await play();
    function play () {
        return new Promise((resolve, reject) => {
            exec(`omxplayer ${filePath}`, (err, stdout, stderr) => {
                if (err) return reject(err);
                resolve({ stdout, stderr });
            });
        });
    }
};

exports.say.defaultText2Sound = defaultText2Sound;