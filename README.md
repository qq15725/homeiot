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

<p align="center"><a href="README.md">README</a> | <a href="README_zh.md">中文文档</a></p>

## Installation

```shell
pnpm add -g homeiot
```

## Usage

### By HomeBridge agency to HomeKit

```shell
pnpm add -g homebridge
```

Configure `config.json` file `platforms` field

```json
{
  "platforms": [
    {
      "platform": "yeelight",
      "name": "Yeelight"
    }
  ]
}
```

Run

```shell
homebridge
```

### By Matter Protocol agency to HomeKit

TODO

### Web Server

TODO

### CLI

TODO

## Packages

| name                | description              |
|---------------------|--------------------------|
| [@homeiot/aqara]    | Aqara LAN control SDK    |
| [@homeiot/xiaomi]   | XiaoMi LAN control SDK   |
| [@homeiot/yeelight] | Yeelight LAN control SDK |

[@homeiot/aqara]: https://github.com/qq15725/homeiot/blob/master/packages/aqara
[@homeiot/xiaomi]: https://github.com/qq15725/homeiot/blob/master/packages/xiaomi
[@homeiot/yeelight]: https://github.com/qq15725/homeiot/blob/master/packages/yeelight
