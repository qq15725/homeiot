<h1 align="center">@homeiot/aqara</h1>

<p align="center">
  <a href="https://github.com/qq15725/homeiot/blob/master/LICENSE" class="mr-3">
    <img src="https://img.shields.io/npm/l/homeiot.svg" alt="License">
  </a>
  <a href="https://www.npmjs.com/package/@homeiot/aqara">
    <img src="https://img.shields.io/npm/v/@homeiot/aqara.svg" alt="Version">
  </a>
  <a href="https://cdn.jsdelivr.net/npm/@homeiot/aqara/dist/index.js">
    <img src="https://img.shields.io/bundlephobia/minzip/@homeiot/aqara" alt="Minzip">
  </a>
</p>

<p align="center"><a href="README.md">README</a> | 中文文档</p>

<p align="center">Node.js 下的绿米局域网控制 SDK</p>

## 安装

```shell
pnpm add @homeiot/aqara
```

## 使用

### 发现本地设备

```ts
import { Discovery } from '@homeiot/aqara'

new Discovery()
  .on('error', err => console.error(err))
  .on('start', () => console.debug('Local discovery started'))
  .on('device', device => console.debug(device))
  .start()
```

## 官方文档

[aqara/aiot-gateway-local-api](https://github.com/aqara/aiot-gateway-local-api)

## 支持的设备

| 名称           | 型号                                     |
|--------------|----------------------------------------|
| 网关           | gateway / gateway.v3                   |
| 门磁感应         | magnet / sensor_magnet                 |
| 人体感应         | motion                                 |
| 按钮           | switch / sensor_switch                 |
| 温度湿度传感器      | sensor_ht                              |
| 单按钮墙壁开关      | ctrl_neutral1                          |
| 双按钮墙壁开关      | ctrl_neutral2                          |
| 单按钮墙壁开关零火版   | ctrl_ln1 / ctrl_ln1.aq1                |
| 双按钮墙壁开关零火版   | ctrl_ln2 / ctrl_ln2.aq1                |
| 86型无线单按钮开关   | 86sw1 / sensor_86sw1.aq1 / sensor_86sw1 |
| 86型无线双按钮开关   | 86sw2 / sensor_86sw2.aq1 / sensor_86sw2 |
| 插座           | plug                                   |
| 86型墙壁插座      | 86plug / ctrl_86plug / ctrl_86plug.aq1 |
| 魔方           | cube / sensor_cube / sensor_cube.aqgl01 |
| 烟雾报警器        | smoke / sensor_smoke                   |
| 天然气报警器       | natgas / sensor_natgas                 |
| 电动窗帘         | curtain                                |
| 门磁感应第二代      | sensor_magnet.aq2                      |
| 人体感应第二代      | sensor_motion.aq2                      |
| 按钮第二代        | sensor_switch.aq2 / remote.b1acn01     |
| 温度湿度传感器第二代   | weather.v1 / weather                   |
| 水浸传感器        | sensor_wleak.aq1                       |
| 门锁           | lock.aq1                               |
| 空调伴侣升级版      | acpartner.v3                           |
| 按钮第二代升级版     | sensor_switch.aq3                      |
| 86型无线双按钮开关升级版 | remote.b286acn01                       |
| 动静贴          | vibration                              |
| 电动窗帘锂电池版     | curtain.hagl04                         |
