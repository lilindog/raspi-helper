"use strict";

const { exec } = require("child_process");
const { mkdirSync, existsSync, writeFileSync } = require("fs");
const { unlink } = require("fs").promises;
const { defaultText2Sound } = require("./lib");
const path = require("path");

const TEMP = path.resolve(__dirname, "temp");

/**
 * 文本发音，将文本转语音播放出来
 * 
 * @param {String}  text
 * @param {defaultText2Sound.Option|Function} value
 */
exports.say = async (text, value) => {
    const 
        tempDir = TEMP,
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
            // omxplayer Raspiberry官网查询资料说是
            // 音量可调范围在 -6000 ～ 0 之间，我这里
            // 默认设置为-500（根据我当前的喇叭实测这个
            // 值最佳）。  
            exec(`omxplayer -o local --vol -500 ${filePath}`, (err, stdout, stderr) => {
                if (err) return reject(err);
                resolve({ stdout, stderr });
            });
        });
    }
};

/**
 * 清除文本缓存
 * 
 * @param  {String} text 要删除语音缓存的文本 
 * @return {Promise<Boolean>}
 */
exports.clearCache = async function (text = "") {
    const filePath = path.resolve(TEMP, text + ".wav");
    if (existsSync(filePath)) {
        await unlink(filePath);
        return true;
    }
    else return false;
};

exports.say.defaultText2Sound = defaultText2Sound;