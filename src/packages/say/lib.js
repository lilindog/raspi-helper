"use strict";

const { timeStamp } = require("console");
const { request } = require("https");
const { stringify } = require("querystring");
const crypto = require("crypto");
const { initOption } = require("../../util");

/**
 * 默认文本转声音，这里用的腾讯云的语音合成
 * 
 * @param {String} text  
 * @return {Stream}
 */
exports.defaultText2Sound = async (text, option) => {
    if (!(option instanceof exports.defaultText2Sound.Option)) throw "defaultText2Sound Option参数不正确！";
    const 
        service = "TextToVoice",
        date = new Date().toLocaleDateString().replace(/\D+/g, "-"),
        timeStamp = new Date().getTime() / 1000,
        query = {
            "Action": service,
            "Version": "2019-08-23",
            "ModelType": "1",
            "SessionId": "1",
            "Text": text,
            "Timestamp": timeStamp,
            "Nonce": Math.random() * 1000 | 0,
            "SecretId": option.secretId,
            "Signature": computeSign(option.sescretId, option.sesecretKey)
        },
        headers = {
            "Content-Type": " application/x-www-form-urlencoded",
            "Host": "cvm.tencentcloudapi.com"
        };
    const res = await new Promise((resolve, reject) => {
        const req = request({
            host: "tts.tencentcloudapi.com",
            path: "/?" + stringify(query),
            headers
        }, res =>{
            let buf = Buffer.from([]);
            res.on("data", chunk => buf = Buffer.concat([buf, chunk]));
            res.on("end", () => resolve(JSON.parse(buf.toString())));
            res.on("error", reject);
        });
        req.on("error", reject);
        req.end();
    });
    console.log(">>>>>>>>>");
    console.log(res);

    function computeSign (secretId, secretKey) {
        const 
            // 腾讯把这个叫做拼接规范请求串
            cr = [
                "GET",
                "/",
                encodeURIComponent(stringify(query)),
                ...Object.keys(headers).reduce((arr, key) => {
                    arr.push(key.toLocaleLowerCase() + ":" + headers[key].toLocaleLowerCase());
                    return arr;
                }, []),
                Object.keys(headers).reduce((s, key) => s += key.toLocaleLowerCase() + ";", "").slice(0, -1),
                ""
            ].join("\n"),
            // 拼接待签名字符串
            sts = [
                "TC3-HMAC-SHA256",
                timeStamp,
                `${date}/${service}/tc3_request`,
                sha256Hex(cr).toLocaleLowerCase()
            ].join("\n"),
            // 派生签名秘钥
            ss = Hmac256(Hmac256(Hmac256("TC3" + secretKey, date), service), "tc3_request"),
            // 签名
            sign = Hmac256Hex(ss, sts);
        return `TC3-HMAC-SHA256 Credential=${secretId}/${date}/${service}/tc3_request,SignedHeaders=${Object.keys(headers).reduce((s, key) => s += key.toLocaleLowerCase() + ";", "").slice(0, -1)},Signature=${sign}` 
        function sha256Hex (str) {
            const hash = crypto.createHash("SHA256");
            hash.update(str);
            return hash.digest("HEX");
        }
        function Hmac256 (str, scret) {
            const hmac = crypto.createHmac("SHA256", scret);
            hmac.update(str);
            return hmac.digest();
        }
        function Hmac256Hex () {
            return Hmac256(...arguments).toString("HEX");
        }
    }
}
exports.defaultText2Sound.Option = class {
    static option = {
        sescretId: "",
        sesecretKey: ""
    }
    constructor (option = {}) { initOption(this, exports.defaultText2Sound.Option, option); }
};