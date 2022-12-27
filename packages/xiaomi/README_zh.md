<h1 align="center">@homeiot/xiaomi</h1>

<p align="center">
  <a href="https://github.com/qq15725/homeiot/blob/master/LICENSE" class="mr-3">
    <img src="https://img.shields.io/npm/l/homeiot.svg" alt="License">
  </a>
  <a href="https://www.npmjs.com/package/@homeiot/xiaomi">
    <img src="https://img.shields.io/npm/v/@homeiot/xiaomi.svg" alt="Version">
  </a>
  <a href="https://cdn.jsdelivr.net/npm/@homeiot/xiaomi/dist/index.mjs">
    <img src="https://img.shields.io/bundlephobia/minzip/@homeiot/xiaomi" alt="Minzip">
  </a>
</p>

<p align="center"><a href="README.md">English</a> | 简体中文</p>

<p align="center">Node.js 下的小米 MIoT/miIO 局域网/公网控制 SDK</p>

## 安装

```shell
npm install @homeiot/xiaomi
```

## 使用

### 发现局域网设备

```ts
import { Discovery } from '@homeiot/xiaomi'

new Discovery()
  .on('error', err => console.error(err))
  .on('start', () => console.log('局域网发现已启动'))
  .on('stop', () => console.log('局域网发现已停止'))
  .on('device', (device: Device) => {
    device.setToken('The token for the device')
    device.miIoInfo()
  })
  .start()
```

## 官方文档

- [miIO-Binary-Protocol](https://github.com/OpenMiHome/mihome-binary-protocol/blob/master/doc/PROTOCOL.md)
- [MIoT-Spec](https://iot.mi.com/new/doc/tools-and-resources/design/spec/overall)
