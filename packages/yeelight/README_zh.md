<h1 align="center">@homeiot/yeelight</h1>

<p align="center">
  <a href="https://github.com/qq15725/homeiot/blob/master/LICENSE" class="mr-3">
    <img src="https://img.shields.io/npm/l/homeiot.svg" alt="License">
  </a>
  <a href="https://www.npmjs.com/package/@homeiot/yeelight">
    <img src="https://img.shields.io/npm/v/@homeiot/yeelight.svg" alt="Version">
  </a>
  <a href="https://cdn.jsdelivr.net/npm/@homeiot/yeelight/dist/index.js">
    <img src="https://img.shields.io/bundlephobia/minzip/@homeiot/yeelight" alt="Minzip">
  </a>
</p>

<p align="center"><a href="README.md">README</a> | <a href="README_zh.md">中文文档</a></p>

<p align="center">Node.js 下的易来局域网控制 SDK</p>

## 安装

```shell
pnpm add @homeiot/yeelight
```

## 使用

### 发现本地设备

```ts
import { Discovery } from '@homeiot/yeelight'
import type { Device } from '@homeiot/yeelight'

new Discovery()
  .on('error', err => console.error(err))
  .on('didFinishLaunching', () => console.debug('Local discovery started'))
  .on('didDiscoverDevice', onDidDiscoverDevice)
  .start()
  .catch(err => console.error(err))

function onDidDiscoverDevice(device: Device) {
  // 智能 LED 被打开
  device.power = 'on'
  // 设置亮度百分比。范围 1 ~ 100
  device.bright = 50
}
```

## 官方文档

[Yeelight WiFi Light Inter-Operation Specification](https://www.yeelight.com/download/Yeelight_Inter-Operation_Spec.pdf)
