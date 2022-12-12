<h1 align="center">@homeiot/xiaomi</h1>

<p align="center">
  <a href="https://github.com/qq15725/homeiot/blob/master/LICENSE" class="mr-3">
    <img src="https://img.shields.io/npm/l/homeiot.svg" alt="License">
  </a>
  <a href="https://www.npmjs.com/package/@homeiot/xiaomi">
    <img src="https://img.shields.io/npm/v/@homeiot/xiaomi.svg" alt="Version">
  </a>
  <a href="https://cdn.jsdelivr.net/npm/@homeiot/xiaomi/dist/index.js">
    <img src="https://img.shields.io/bundlephobia/minzip/@homeiot/xiaomi" alt="Minzip">
  </a>
</p>

<p align="center"><a href="README.md">README</a> | <a href="README_zh.md">中文文档</a></p>

<p align="center">Node.js 下的小米局域网控制 SDK</p>

## 安装

```shell
pnpm add @homeiot/xiaomi
```

## 使用

### 发现设备

```ts
import { Discovery } from '@homeiot/xiaomi'

const log = console

new Discovery()
  .on('started', () => log.debug('Discovery Started'))
  .on('error', err => log.error(err))
  .on('discovered', device => log.debug(device))
  .start()
  .catch(err => log.error(err))
```

## 官方文档

[Xiaomi Mi Home Binary Protocol](https://github.com/OpenMiHome/mihome-binary-protocol/blob/master/doc/PROTOCOL.md)
