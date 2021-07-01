"use strict"

const { wifi, say: Say, say: { say } } = require("../src/index");

!async function () {
    // while (true) {
    //     const text = "支付成功，请不要拉拽打印中的凭条";
    //     await say.say(text, new say.say.defaultText2Sound.Option({ secretId: "AKID44pO5VuY9TCg2KLOAujkYFbv8E3SMR4I", secretKey: "J9k51nSinrWuWN6bstEJAmwpOhv6wOZc" }));
    // }

    // console.log(wifi.list());    
    // wifi.add("Redmi", "123456798");
    // console.log(wifi.list());   

    // Say.clearCache("支付成功，请不要拉拽打印中的凭条");

    say("支付成功，请不要拉拽打印中的凭条", new say.defaultText2Sound.Option({
            secretId: "",
            secretKey: "",
    }));
}();