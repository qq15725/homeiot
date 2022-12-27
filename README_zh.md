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

<p align="center"><a href="README.md">README</a> | 中文文档</p>

## 安装

```shell
pnpm add -g homeiot
```

## 使用

⚠️ **当前版本暂不可用**

### HomeBridge

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

### TODO

- [ ] HomeKit(HomeBridge) 控制
- [ ] Web 控制
- [ ] 命令行控制
- [ ] 支持 Matter 协议

## 子包

| 名字                 | 描述            |
|--------------------|---------------|
| [@homeiot/aqara]   | 绿米局域网控制 SDK   |
| [@homeiot/xiaomi]   | 小米局域网/云控制 SDK |
| [@homeiot/xiaomi-cli] | 小米局域网/云控制 CLI |
| [@homeiot/yeelight] | 易来局域网控制 SDK   |
| [@homeiot/yeelight-cli] | 易来局域网控制 CLI   |

[@homeiot/aqara]: https://github.com/qq15725/homeiot/blob/master/packages/aqara/README_zh.md
[@homeiot/xiaomi]: https://github.com/qq15725/homeiot/blob/master/packages/xiaomi/README_zh.md
[@homeiot/xiaomi-cli]: https://github.com/qq15725/homeiot/blob/master/packages/xiaomi-cli/README_zh.md
[@homeiot/yeelight]: https://github.com/qq15725/homeiot/blob/master/packages/yeelight/README_zh.md
[@homeiot/yeelight-cli]: https://github.com/qq15725/homeiot/blob/master/packages/yeelight-cli/README_zh.md
