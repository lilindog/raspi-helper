"use strict";

const { execSync } = require("child_process");
const { ScanNode, ListNode } = require("./type");
const PRE_CMD = `wpa_cli -i wlan0 `;

Object.assign(exports, {
    ScanNode,
    ListNode
});

function err (msg = "") {
    throw "[ wifi-manager ] error: " + msg;
}

/**
 * 扫描周围的wifi, 没有ssid的wifi不会列出来
 * 
 * @return {Array<ScanNode>} 
 */
exports.scan = () => {
    const reg = /((?:[\d\w]{2}:){5}[\d\w]{2})\t+(\d{4})\t+-(\d{2,})\t+((?:\[[\d-+\w]+\])+)\t+([^\n]+)/ig;
    return f().map(row => {
        const [ bssid, frequency, signalLevel, flags, ssid ] = Array.from(reg.exec(row)).slice(1);
        reg.lastIndex = 0;
        return {
            bssid, frequency, signalLevel, flags, ssid
        };
    });
    function f () {
        execSync(`${PRE_CMD} scan`);
        const res = execSync(`${PRE_CMD} scan_result`).toString().match(reg);
        if (res) return res;
        else return f();
    }
};

/**
 * 列出连接过的wifi 
 * 
 * @return {Array<ListNode>} [{ id: String, ssid: String, state: CURRENT|DISABLED }, ...]
 */
exports.list = () => {
    const reg = /(\d+)\s+(\w+)\s+(\w+)\s\[(\w+)\]/ig;
    return (
        (execSync(`${PRE_CMD} list_network`).toString()).match(reg) || []
    ).map(row => {
        const res = reg.exec(row);
        reg.lastIndex = 0;
        return {
            id: res[1],
            ssid: res[2],
            state: res[4]
        };
    });
};

/**
 * 删除连接过的wifi 
 * 
 * @param {Number} id
 */
exports.remove = id => {
    if (exports.list().some(row => Number(row.id) === id)) {
        execSync(`wpa_cli -i wlan0 remove_network ${id}`);
        execSync(`${PRE_CMD} save_config`);
    }
};

/**
 * 增加新的wifi连接
 * 
 * @param {String} ssid wifi名字
 * @param {String} psk  wifi密码
 * @param {String} key_mgmt wifi加密方式，不懂请参考相关资料
 */
exports.add = (ssid, psk, key_mgmt) => {
    const id = Number(execSync(`${PRE_CMD} add_network`).toString().replace(/\s+/, ""));
    exports.edit(id, ssid, psk, key_mgmt);
};

/**
 * 修改已存wifi的账密、加密方式
 * 
 * @param {Number} id 连接id，参见list返回的id
 * @param {String} ssid 
 * @param {String} psk
 * @param {String} key_mgmt 
 */
exports.edit = (id, ssid, psk, key_mgmt) => {
    if (!exports.list().some(i => Number(i.id) === id)) err("指定id的连接不存在");
    execSync(`${PRE_CMD} set_network ${id} ssid '"${ssid}"'`);
    key_mgmt !== undefined && execSync(`${PRE_CMD} set_network ${id} key_mgmt '"${key_mgmt}"'`);
    execSync(`${PRE_CMD} set_network ${id} psk '"${psk}"'`);
    execSync(`${PRE_CMD} save_config`);
};