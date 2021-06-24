"use strict";

const { execSync } = require("child_process");
const { ScanNode, ListNode, Status } = require("./type");
const PRE_CMD = `wpa_cli -i wlan0 `;

Object.assign(exports, {
    ScanNode,
    ListNode,
    Status
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
        return new ScanNode({
            bssid, frequency, signalLevel, flags, ssid
        });
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
        return new ListNode({
            id: res[1],
            ssid: res[2],
            state: res[4]
        });
    });
};

/**
 * 删除连接过的wifi 
 * 
 * @param {Number} id
 */
exports.remove = id => {
    if (exports.list().some(row => Number(row.id) === Number(id))) {
        execSync(`${PRE_CMD} remove_network ${id}`);
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
    exports.edit(Number(id), ssid, psk, key_mgmt);
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
    if (!exports.list().some(i => Number(i.id) === Number(id))) err("指定id的连接不存在");
    execSync(`${PRE_CMD} set_network ${id} ssid '"${ssid}"'`);
    key_mgmt !== undefined && execSync(`${PRE_CMD} set_network ${id} key_mgmt '"${key_mgmt}"'`);
    execSync(`${PRE_CMD} set_network ${id} psk '"${psk}"'`);
    execSync(`${PRE_CMD} save_config`);
};

/**
 * 查看无线连接状态
 * 
 * @return {Status} 
 */
exports.status = () => {
    return new Status(execSync(`${PRE_CMD} status`).toString().replace(/\s+/g, " ").split(" ").reduce((t, c) => {
        const [key, value] = c.split(/\s*=\s*/);
        if (Status.option[key] !== undefined) t[key] = value;
        return t;
    }, {}));
};

/**
 * 连接 wifi, 若15秒没拿到分配的ip返回false
 * 
 * @param  {Number}   id 连接列表中的那个wifi
 * @param  {Function} cb 可选，不天返回Promise实例
 * @return {Boolean}
 */
exports.connect = async (id, cb) => {
    const time = new Date().getTime();
    execSync(`${PRE_CMD} select_network ${id}`);
    let p, success, error;
    if (!cb) p = new Promise((resolve, reject) => {
        success = resolve;
        error = reject;
    });
    let timer = setInterval(() => {
        const { ip_address: ip, wpa_state: state } = exports.status();
        if (ip && state === "COMPLETED") {
            clearInterval(timer);
            p ? success() : cb();
        }
        else if (new Date().getTime() - time >= 15000) {
            clearInterval(timer);
            const err = new Error("wifi连接失败");
            p ? error(err) : cb(err);
        }
    }, 500);
    if (p) return p;
};

/**
 * 断开 wifi 连接 
 * 
 * @param {Number} id 需要短wifi的id
 */
exports.disconnect = id => {
    execSync(`${PRE_CMD} disable_network ${id}`);
};