"use strict";

/**
 * 昱闵读卡器（YMC151-D2）以及相关读卡模块的nodejs协议封
 * 装提供基础功能，若扩展和分层细化需要参考读卡器数据协议
 * 文档
 */

const Serialport = require("serialport");
const { EventEmitter } = require("events");

class ParamsType {
    constructor (params = {}) {
        Reflect.ownKeys(new.target.fields).forEach(k => this[k] = params[k] ?? new.target.fields[k]);
    }
}

/**
 * 返回包类型 
 */
class BackFrame extends ParamsType {
    static fields = {
        // 命令类型
        cmd_type: -1,
        // 包长度
        packet_length: 0,
        // 命令
        cmd: "",
        // 地址，串口模式固定0x20
        addr: 20,
        // 状态，0成功，1失败
        status: -1,
        // 数据字节
        data: undefined,
        // 校验位
        check_sum: -1
    }
    constructor (params = {}) {
        super(params);
    }
}

/**
 * 读卡器获取、设置状态类型 
 */
class Status extends ParamsType {
    static fields = {
        // 工作模式， 1命令模式，2自动读卡号，3自动读块（需要第6字节指定块号），4自动读卡又读块
        work_mode: -1,
        // 自动读块的块号
        auto_read_block: -1,
        // 读卡后的上传模式，0主动上传，1被动上传（命令）
        upload_mode: -1,
        // 蜂鸣器使能，0关闭，1开启；建议关闭，由业务逻辑来调用蜂鸣器动作
        beep_enable: -1,
        // 读卡模式，0靠近时第一次，1一直读
        auto_read_mode: -1,
        // 读卡器序列号，该属性只读（也就是不可设置）
        serial_number: -1
    }
    constructor (params = {}) {
        super(params);
    }
}

class CardReader extends EventEmitter {
    static Status = Status;
    static BackFrame = BackFrame;
    static EVENTS = {
        // 接收到读卡器数据包后触发
        "PACKET": "packet",
        // 设备就绪
        "READY":  "ready"
    };
    // 是否初始化，用于在写入时候判断之前没有主动调用init方法就抛错终止写入。
    // 为啥要这样做，一句话讲不清；说就是异步。  
    #isInit = false;
    #isOpen = false;
    #callback;
    #buffer = [];
    #serialport;

    _throwError (msg = "") {
        if (msg) {
            throw "[CardReader] " + msg;
        }
    }

    _sleep (ms = 50) {
        return new Promise(r => setTimeout(r, ms));
    }

    constructor ({ path = "", baudRate = 9600 }) {
        super();
        this.#serialport = new Serialport(path, { baudRate });
        this.#serialport.on("open", () => {
            this.#isOpen = true;
            this.#callback && this.#callback();
            this.#callback = undefined;
            this.emit(CardReader.EVENTS.READY);
        });
        this.#serialport.on("data", this._parseFrame.bind(this));
    }

    _parseFrame (chunk = Buffer.alloc(0)) {
        let buf = this.#buffer = [...this.#buffer, ...chunk];
        if (buf.length < 2) return;
        const bf = new BackFrame({});
        bf.cmd_type = buf[0];
        bf.packet_length = buf[1];
        if (buf.length < bf.packet_length) return;
        buf = buf.slice(2, bf.packet_length);
        bf.cmd = buf[0];
        bf.addr = buf[1];
        bf.status = buf[2];
        bf.data = buf.slice(3, -1);
        bf.check_sum = buf.slice(-1)[0];
        if (
            (~Reflect.ownKeys(BackFrame.fields).filter(k => k !== "check_sum").reduce((t, k) => {
                if (typeof bf[k] === "number") {
                    t ^= bf[k];
                } else {
                    Array.from(bf[k]).forEach(i => t ^= i);
                }
                return t;
            }, 0) & 0xff)
            ===
            bf.check_sum
        ) {
            if (this.#callback) { 
                this.#callback(bf);
                this.#callback = undefined;
            } else {
                this.emit(CardReader.EVENTS.PACKET, bf);
            }
        }
        this.#buffer = this.#buffer.slice(bf.packet_length);
    }

    _buildFrame (bytes = []) {
        // 第二个字节表示长度
        bytes.splice(1, 0, bytes.length + 2);
        bytes.push(~bytes.reduce((t, c) => {
            t ^= c;
            return t;
        }, 0) & 0xff);
        return bytes;
    }

    async _write (bytes = []) {
        if (!this.#isInit) this._throwError("请先调用init方法后再调用其它方法！");
        if (this.#callback) this._throwError("请等待上次命令响应后再写入！");
        // if (this.#callback) return;
        return new Promise((r, reject) => {
            this.#callback = packet => {
                clearTimeout(id);
                this.#callback = undefined;
                r(packet);
            };
            let id = setTimeout(() => {
                clearTimeout(id);
                this.#callback = undefined;
                reject();
            }, 2000);
            this.#serialport.write(Buffer.from(bytes)); 
        });
    }

    /**
     * 初始化，等待设备就绪 
     */
    async init () {
        if (this.#isOpen) {
            this.#isInit = true;
            return;
        }
        return new Promise(r => {
            this.#callback = () => {
                this.#isInit = true;
                this.#callback = undefined;
                r();
            };
        });
    }

    /**
     * 设置读卡器状态 
     * 
     * @param  {CardReader.Status} status
     * @return {Promise<void>}
     */
    async setStatus (status = {}) {
        if (!(status instanceof Status)) this._throwError("setting 方法参数必须为Status实例！");
        if (status.work_mode !== -1) {
            await this._write(this._buildFrame([
                0x03, 0xC1, 0x20, 
                status.work_mode,
                // 设置自动读取块号
                [ 0x03, 0x04 ].includes(status.work_mode) ? (status.auto_read_block ?? 0) : 0, 
                // 自动读取后立即上传，还是上位机主动询问
                [ 0x02, 0x03, 0x04 ].includes(status.work_mode) ? (status.upload_mode ?? 0) : 0
            ]));
        }
        if (status.beep_enable !== -1) {
            await this._write(this._buildFrame([
                0x03, 0xc2, 0x20, 
                // 1开启，0关闭
                status.beep_enable,
                0x00, 0x00
            ]));
        }
        if (status.auto_read_mode !== -1) {
            await this._write(this._buildFrame([
                0x03, 0xc8, 0x20,
                // 0接近制度一次，1不断重复读
                status.auto_read_mode,
                0x00, 0x00
            ]));
        }
    }

    /**
     * 获取读卡器状态 
     * 
     * @return {Promise<CardReader.Status>}
     */
    async status () {
        /**
         * 工作模式、自动上传块号，上传模式
         * 具体解释请看硬件协议文档 
         */
        let [ work_mode, auto_read_block, upload_mode ] = (await this._write([ 0x02, 0x08, 0xb1, 0x20, 0x00, 0x00, 0x00, 0x64 ]))?.data ?? [];
        // 蜂鸣器启用状态
        let [ beep_enable ] = (await this._write([ 0x02, 0x08, 0xB2, 0x20, 0x00, 0x00, 0x00, 0x67 ]))?.data ?? [];
        // 自动读卡模式，连续读、接近只读一次
        let [ auto_read_mode ] = (await this._write([ 0x02, 0x08, 0xB8, 0x20, 0x00, 0x00, 0x00, 0x6D ]))?.data ?? [];
        // 读卡器序列号
        let serial_number = ((await this._write([ 0x02, 0x08, 0xF9, 0x20, 0x00, 0x00, 0x00, 0x2C ]))?.data ?? []).reduce((t, c) => {
            const s = c.toString(16);
            t += s.length < 2 ? "0" + s : s;
            return t;
        }, "");
        return new Status({ work_mode, auto_read_block, upload_mode, beep_enable, auto_read_mode, serial_number });
    }

    /**
     * 复位读卡器 
     * 
     * @return {Promise<void>}
     */
    async reset () {
        await this._write([ 0x55, 0xf0, 0x20, 0x00, 0x00 ]);
    }
    
    /**
     * 蜂鸣器 
     * 
     * @param  {Number} count 响几声
     * @param  {Number} time 持续事件ms
     * @param  {Number} spaceTime 间隔时间ms
     * @return {Promise<void>}
     */
    async beep (count = 1, time = 100, spaceTime = 50) {
        for (let i = 0; i < count; i++) {
            await this._write(Buffer.from([ 0x04, 0x08, 0xD1, 0x20, 0x00, 0x00, 0x00, 0x02 ]));
            await this._sleep(time);
            await this._write(Buffer.from([ 0x04, 0x08, 0xD2, 0x20, 0x00, 0x00, 0x00, 0x01 ]));
            await this._sleep(spaceTime);
        }
    }

    /**
     * 设置读卡器keyA、控制位、keyB 
     */
    // setReaderKey (keyA = [], keyB = [], controlBits = []) {
        
    // }

    /**
     * 读数据块 
     * 
     * @param  {Number} blockNumber 块号，只能为非0和非控制块
     * @param  {String} useKey a|b 使用那个key
     * @param  {Boolean} isBeep 蜂鸣器是否发声
     * @return {Promise<CardReader.BackFrame>}
     */
    async readBlock (blockNumber = 1, useKey = "a", isBeep = false) {
        if (blockNumber === 0 || (blockNumber + 1) % 4 === 0) this._throwError("blockNumber 不能为0和控制块！");
        return await this._write(this._buildFrame([
            0x01, 
            useKey === "a" ? 0xa3 : useKey === "b" ? 0x5c : 0,
            0x20, 
            blockNumber,
            isBeep ? 0x01 : 0x00,
            0x00
        ]));
    }

    /**
     * 写数据块 
     * 
     * @param  {Number} blockNumber 块号
     * @param  {String} useKey 使用那个key a|b
     * @param  {Boolean} isBeep 蜂鸣器是否发声
     * @return {Promise<CardReader.BackFrame}
     */
    async writeBlock (blockNumber = 1, useKey = "a", isBeep = false, dataBytes = []) {
        let msg = "";
        if (blockNumber === 0 || (blockNumber + 1) % 4 === 0) 
            msg = "blockNumber 不能为0和控制块！";
        else if (dataBytes.length !== 16) 
            msg = "数据只能为16字节！";
        if (msg) this._throwError(msg);
        await this._write(this._buildFrame([
            0x01,
            useKey === "a" ? 0xa4 : useKey === "b" ? 0x5b : 0,
            0x20,
            blockNumber,
            isBeep ? 0x01 : 0x00,
            ...dataBytes
        ]));
    }

    /**
     * 读卡号
     * 
     * @param  {Boolean} isBeep 蜂鸣器是否发声
     * @return {Promise<CardReader.BackFrame>} 
     */
    async readCardNumber (isBeep = false) {
        return await this._write(this._buildFrame([
            0x01, 0xa1, 0x20, 0x00,
            isBeep ? 0x01 : 0x00,
            0x00
        ]));
    }
}

module.exports = CardReader;