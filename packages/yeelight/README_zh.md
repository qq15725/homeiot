<h1 align="center">@homeiot/yeelight</h1>

<p align="center">
  <a href="https://github.com/qq15725/homeiot/blob/master/LICENSE" class="mr-3">
    <img src="https://img.shields.io/npm/l/homeiot.svg" alt="License">
  </a>
  <a href="https://www.npmjs.com/package/@homeiot/yeelight">
    <img src="https://img.shields.io/npm/v/@homeiot/yeelight.svg" alt="Version">
  </a>
  <a href="https://cdn.jsdelivr.net/npm/@homeiot/yeelight/dist/index.mjs">
    <img src="https://img.shields.io/bundlephobia/minzip/@homeiot/yeelight" alt="Minzip">
  </a>
</p>

<p align="center"><a href="README.md">English</a> | 简体中文</p>

<p align="center">Node.js 下的易来局域网控制 SDK</p>

## 安装

```shell
npm install @homeiot/yeelight
```

## 使用

### 发现局域网设备

```ts
import { Discovery } from '@homeiot/yeelight'
import type { Device } from '@homeiot/yeelight'

new Discovery()
  .on('error', err => console.error(err))
  .on('start', () => console.log('局域网发现已启动'))
  .on('stop', () => console.log('局域网发现已停止'))
  .on('device', (device: Device) => {
    // 智能 LED 被打开
    device.power = 'on'
  })
  .start()
```

### 控制局域网设备

```ts
import { Device } from '@homeiot/yeelight'

const device = new Device({ host: '192.168.1.239' })
  .on('error', err => console.error(err))
  .on('start', () => console.log('局域网设备已连接'))
  .on('stop', () => console.log('局域网设备已断开'))
  .on('request', data => console.log('[请求]', data))
  .on('response', data => console.log('[响应]', data))

// 智能 LED 被打开
device.power = 'on'
// 设置亮度百分比。范围 1 ~ 100
device.bright = 50
```

## 官方文档

[Yeelight WiFi Light Inter-Operation Specification](https://www.yeelight.com/download/Yeelight_Inter-Operation_Spec.pdf)
