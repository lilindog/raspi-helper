"use strict"

const { runCmds } = require("./comm");

!async function () {
    if (!await runCmds(["npm run lint"])) {
        console.log("\n): 代码 eslint 检测不通过, 请检查规范！\n");
        process.exit(1);
    } else {
        console.log("\n(: eslint 代码检测通过\n");
    }
}();
