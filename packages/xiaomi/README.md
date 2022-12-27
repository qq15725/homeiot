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

<p align="center">English | <a href="README_zh.md">简体中文</a></p>

<p align="center">Xiaomi MIoT/miIO LAN/WAN control SDK for Node.js</p>

## Installation

```shell
npm install @homeiot/xiaomi
```

## Usage

### Discover LAN device

```ts
import { Discovery } from '@homeiot/xiaomi'

new Discovery()
  .on('error', err => console.error(err))
  .on('start', () => console.log('LAN discovery started'))
  .on('stop', () => console.log('LAN discovery stoped'))
  .on('device', (device: Device) => {
    device.setToken('The token for the device')
    device.miIoInfo()
  })
  .start()
```

## Official documentation

- [miIO-Binary-Protocol](https://github.com/OpenMiHome/mihome-binary-protocol/blob/master/doc/PROTOCOL.md)
- [MIoT-Spec](https://iot.mi.com/new/doc/tools-and-resources/design/spec/overall)
