<h1 align="center">Home IoT</h1>

<p align="center">
  <a href="https://github.com/qq15725/homeiot/blob/master/LICENSE" class="mr-3">
    <img src="https://img.shields.io/npm/l/homeiot.svg" alt="License">
  </a>
  <a href="https://www.npmjs.com/package/homeiot">
    <img src="https://img.shields.io/npm/v/homeiot.svg" alt="Version">
  </a>
  <a href="https://cdn.jsdelivr.net/npm/homeiot/dist/index.js">
    <img src="https://img.shields.io/bundlephobia/minzip/homeiot" alt="Minzip">
  </a>
</p>

<p align="center">README | <a href="README_zh.md">中文文档</a></p>

## Installation

```shell
pnpm add -g homeiot
```

## Usage

⚠️ **Current version temporarily unavailable**

### HomeBridge

```shell
pnpm add -g homebridge
```

Configure `config.json` file `platforms` field

```json
{
  "platforms": [
    { "platform": "yeelight", "name": "Yeelight" },
    { "platform": "xiaomi", "name": "Xiaomi" }
  ]
}
```

Run

```shell
homebridge
```

### TODO

- [ ] HomeKit(HomeBridge) Control
- [ ] Web Control
- [ ] CLI Control
- [ ] Supports Matter Protocal

## Sub Packages

| name                    | description                          |
|-------------------------|--------------------------------------|
| [@homeiot/aqara]        | Aqara LAN control SDK                |
| [@homeiot/xiaomi]       | Xiaomi MIoT/miIO LAN/WAN control SDK |
| [@homeiot/xiaomi-cli]   | Xiaomi MIoT/miIO LAN/WAN control CLI |
| [@homeiot/yeelight]     | Yeelight LAN control SDK             |
| [@homeiot/yeelight-cli] | Yeelight LAN control CLI             |

[@homeiot/aqara]: https://github.com/qq15725/homeiot/blob/master/packages/aqara
[@homeiot/xiaomi]: https://github.com/qq15725/homeiot/blob/master/packages/xiaomi
[@homeiot/xiaomi-cli]: https://github.com/qq15725/homeiot/blob/master/packages/xiaomi-cli
[@homeiot/yeelight]: https://github.com/qq15725/homeiot/blob/master/packages/yeelight
[@homeiot/yeelight-cli]: https://github.com/qq15725/homeiot/blob/master/packages/yeelight-cli
