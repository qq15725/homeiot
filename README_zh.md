<h1 align="center">家庭物联网</h1>

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

## 安装

```shell
pnpm add -g homeiot
```

## 使用

### 使用 HomeBridge 代理到 HomeKit

```shell
pnpm add -g homebridge
```

配置 `config.json` 文件的 `platforms` 字段

```json
{
  "platforms": [
    { "platform": "yeelight", "name": "Yeelight" },
    { "platform": "xiaomi", "name": "Xiaomi" }
  ]
}
```

执行

```shell
homebridge
```

### 使用 Matter 协议代理到 HomeKit

TODO

### Web 服务

TODO

### 命令行控制

TODO

## 子包

| 名字                 | 描述         |
|--------------------|------------|
| [@homeiot/aqara]   | 绿米局域网控制 SDK |
| [@homeiot/xiaomi]   | 小米局域网控制 SDK |
| [@homeiot/yeelight] | 易来局域网控制 SDK |

[@homeiot/aqara]: https://github.com/qq15725/homeiot/blob/master/packages/aqara/README_zh.md
[@homeiot/xiaomi]: https://github.com/qq15725/homeiot/blob/master/packages/xiaomi
[@homeiot/yeelight]: https://github.com/qq15725/homeiot/blob/master/packages/yeelight/README_zh.md
