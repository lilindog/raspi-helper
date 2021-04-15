"use strict";

const { writeFileSync, existsSync } =require("fs");
const { parse } = require("path");
const platform = require("os").platform();
const { execSync } = require("child_process");

// 存放脚本的目录
const SCRIPTS_DIR = "scripts";
// 脚本前缀
const SCRIPT_PREFIX = "githook_";

main();

function main () {
    console.log("开始部署本地githooks >>");
    const writedScripts = [];
    [
        "pre-push",
        "pre-commit"
    ].forEach(name => {
        const path = `${SCRIPTS_DIR}/${SCRIPT_PREFIX}${name}.js`;
        if (existsSync(path)) {
            writedScripts.push(path);
            writeHookFile(path);
        }
    });
    if (writedScripts.length) {
        platform !== "win32" && execSync(`chmod -R 777 .git/hooks`);
        console.log(`githooks 部署完成，共有${writedScripts.length}个hook被部署：`);
        writedScripts.forEach((path, index) => {
            console.log(`(${index + 1}) -> ${path}`);
        });
    } else {
        console.log("githooks 部署完成，没有githook被部署！");
    }
    console.log("");
}

function writeHookFile (path) {
    writeFileSync(
        `.git/hooks/${parse(path).name.split("_")[1]}`, 
        `#!/usr/bin/env node
        const { spawn } = require("child_process");
        const cp = spawn("node", ["${path}"], { stdio: "inherit" });
        cp.on("exit", code => {
            process.exit(code);
        });
        `
        .replace(/\s/, "<sign1>")
        .replace(/\n/, "<sign2>")
        .replace(/\s+/g, " ")
        .replace(/\n/g, "")
        .replace("<sign1>", " ")
        .replace("<sign2>", "\n")
    );
}