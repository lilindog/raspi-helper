"use strict";

const { initOption } = require("../../util");

/**
 * 连接过的wifi列表子元素 
 */
exports.ListNode = class ListNode {
    static option = {
        id: "",
        ssid: "",
        state: ""
    }
    constructor (option = {}) { initOption(this, ListNode.option, option); }
};

/**
 * 扫描周围wifi列表子元素 
 */
exports.ScanNode = class ScanNode {
    static option = {
        bssid: "", 
        frequency: 0, 
        signalLevel: 0, 
        flags: "", 
        ssid: ""
    }
    constructor (option = {}) { initOption(this, ScanNode.option, option); }
};

/**
 * wifi 状态结构类 
 */
exports.Status = class Status {
    static option = {
        ssid: "",
        key_mgmt: "",
        wpa_state: "",
        ip_address: "",
        bssid: "",
        freq: 0,
        id: 0
    }
    constructor (option = {}) { initOption(this, Status.option, option); }
};