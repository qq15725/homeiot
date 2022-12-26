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

<p align="center">XiaoMi LAN control SDK for Node.js</p>

## Installation

```shell
pnpm add @homeiot/xiaomi
```

## Usage

### Discover local device

```ts
import { Discovery, Api } from '@homeiot/xiaomi'

new Api('xiaomi-user-name', 'password')
  .getDevices()
  .then(devices => {
    const didDevices = devices.reduce(
      (device, map) => ({ ...map, [Number(device.did)]: device.token }),
      {} as Record<number, any>,
    )

    new Discovery(didDevices)
      .on('error', err => console.error(err))
      .on('start', () => console.debug('Local discovery started'))
      .on('device', device => console.debug(device))
      .start()
  })
```

## Official documentation

### miIO Binary Protocol

[OpenMiHome/mihome-binary-protocol](https://github.com/OpenMiHome/mihome-binary-protocol/blob/master/doc/PROTOCOL.md)

### MIoT

[MIoT-Spec](https://iot.mi.com/new/doc/tools-and-resources/design/spec/overall)

- [devices](http://miot-spec.org/miot-spec-v2/spec/devices)
- [services](http://miot-spec.org/miot-spec-v2/spec/services)
- [properties](http://miot-spec.org/miot-spec-v2/spec/properties)
- [actions](http://miot-spec.org/miot-spec-v2/spec/actions)
- [events](http://miot-spec.org/miot-spec-v2/spec/events)
- [instances](http://miot-spec.org/miot-spec-v2/instances?status=all)
