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

<p align="center">Yeelight LAN control SDK for Node.js</p>

## Installation

```shell
pnpm add @homeiot/yeelight
```

## Usage

### Discover local device

```ts
import { Discovery } from '@homeiot/yeelight'
import type { Device } from '@homeiot/yeelight'

new Discovery()
  .on('error', err => console.error(err))
  .on('didFinishLaunching', () => console.debug('Local discovery started'))
  .on('didDiscoverDevice', onDidDiscoverDevice)
  .start()

function onDidDiscoverDevice(device: Device) {
  // Smart LED is turned on
  device.power = 'on'
  // Brightness percentage. Range 1 ~ 100
  device.bright = 50
}
```

### Specified local device connection

```ts
import { Device } from '@homeiot/yeelight'

const device = new Device({ host: '192.168.1.239' })
// Smart LED is turned on
device.power = 'on'
// Brightness percentage. Range 1 ~ 100
device.bright = 50
```

## Official documentation

[Yeelight WiFi Light Inter-Operation Specification](https://www.yeelight.com/download/Yeelight_Inter-Operation_Spec.pdf)
