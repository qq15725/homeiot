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

### 发现本地设备

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
      .on('didFinishLaunching', () => console.debug('Local discovery started'))
      .on('didDiscoverDevice', device => console.debug(device))
      .on('missingToken', (info, remote) => console.error(info, remote))
      .start()
      .catch(err => console.error(err))
  })
```

## 官方文档

### Miot binary Protocol

[Xiaomi Mi Home Binary Protocol](https://github.com/OpenMiHome/mihome-binary-protocol/blob/master/doc/PROTOCOL.md)

### Miot spec v2

- [actions](http://miot-spec.org/miot-spec-v2/spec/actions)
- [devices](http://miot-spec.org/miot-spec-v2/spec/devices)
- [events](http://miot-spec.org/miot-spec-v2/spec/events)
- [services](http://miot-spec.org/miot-spec-v2/spec/services)
- [properties](http://miot-spec.org/miot-spec-v2/spec/properties)
- [instances](http://miot-spec.org/miot-spec-v2/instances?status=all)
