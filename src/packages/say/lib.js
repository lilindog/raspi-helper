"use strict";

const { initOption } = require("../../util");
const tencentcloud = require("tencentcloud-sdk-nodejs");

/**
 * 默认文本转声音的函数，这里用的腾讯云的语音合成
 * 
 * @param {String} text  
 * @return {Stream}
 */
exports.defaultText2Sound = async (text, option) => {
    if (!(option instanceof exports.defaultText2Sound.Option)) throw "defaultText2Sound Option参数不正确！";
    const res = await new Promise((resolve, reject) => {
        // 这里是用了腾讯云的tts sdk，原本使用的自己写请求，最终因为签名计算太复杂调试麻烦。
        const 
            TtsClient = tencentcloud.tts.v20190823.Client,
            clientConfig = {
                credential: {
                    secretId: option.secretId,
                    secretKey: option.secretKey
                },
                region: "ap-shanghai",
                profile: {
                    httpProfile: {
                        endpoint: "tts.tencentcloudapi.com"
                    }
                }
            },
            client = new TtsClient(clientConfig),
            params = {
                VoiceType: option.voiceType,
                ModelType: 1,
                SessionId: "1",
                Text: text
            };
        client.TextToVoice(params).then(resolve, reject);
    });
    return Buffer.from(res.Audio, "base64");
};
exports.defaultText2Sound.Option = class {
    static option = {
        secretId: "",
        secretKey: "",
        voiceType: 7 // 默认云小曼
    }
    constructor (option = {}) { initOption(this, exports.defaultText2Sound.Option.option, option); }
};