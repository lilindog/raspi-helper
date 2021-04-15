/**
 * 连接过的wifi列表子元素 
 */
exports.ListNode = class ListNode {
    static option = {
        id: "",
        ssid: "",
        state: ""
    }
    constructor (option = {}) { initOption(this, ListNode.option, option) }
}

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
    constructor (option = {}) { initOption(this, ScanNode.option, option) }
}

function initOption (context = {}, templateStruct = {}, option = {}) {
    Object.keys(templateStruct).forEach(k => context[k] = option[k] !== undefined ? option[k] : templateStruct[k]);
}