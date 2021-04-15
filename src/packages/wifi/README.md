# WIFI 管理

对 wpa_cli 进行了封装，目前阶段只针对了 Raspberry PI4 进行了实测通过。

## API

扫描周围 wifi:
```js
const { wifi } = require("raspberry-helper");
console.log(wifi.scan());
```

获取当前已有的 wifi 连接列表：
```js
const { wifi } = require("raspberry-helper");
console.log(wifi.list());
```

删除已有的 wifi 连接：
```js
const { wifi } = require("raspberry-helper");
// 这里的id是指list()列出来的元素的id
const id = "xxx"; 
wifi.remove(id);
```

创建并保存 wifi 连接：
```js
const { wifi } = require("raspberry-helper");
const ssid = "mywifi", psk = "12345678";
wifi.add(ssid, psk);
```

编辑已保存的 wifi 的账密以及加密方式：
```js
const { wifi } = require("raspberry-helper");
const id = 1, ssid = "mywifi", psk = "12345678";
wifi.edit(id, ssid, psk);
```