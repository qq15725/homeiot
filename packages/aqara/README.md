<h1 align="center">@homeiot/aqara</h1>

<p align="center">
  <a href="https://github.com/qq15725/homeiot/blob/master/LICENSE" class="mr-3">
    <img src="https://img.shields.io/npm/l/homeiot.svg" alt="License">
  </a>
  <a href="https://www.npmjs.com/package/@homeiot/aqara">
    <img src="https://img.shields.io/npm/v/@homeiot/aqara.svg" alt="Version">
  </a>
  <a href="https://cdn.jsdelivr.net/npm/@homeiot/aqara/dist/index.js">
    <img src="https://img.shields.io/bundlephobia/minzip/@homeiot/aqara" alt="Minzip">
  </a>
</p>

<p align="center"><a href="README.md">README</a> | <a href="README_zh.md">中文文档</a></p>

<p align="center">Aqara LAN control SDK for Node.js</p>

## Installation

```shell
pnpm add @homeiot/aqara
```

## Usage

### Discover local device

```ts
import { Discovery } from '@homeiot/aqara'

new Discovery()
  .on('error', err => console.error(err))
  .on('didFinishLaunching', () => console.debug('Local discovery started'))
  .on('didDiscoverDevice', device => console.debug(device))
  .start()
  .catch(err => console.error(err))
```

## Official documentation

[aqara/aiot-gateway-local-api](https://github.com/aqara/aiot-gateway-local-api)

## Supported devices

| Device Name                  | Protocol Model Value                    |
|------------------------------|-----------------------------------------|
| Gateway                      | gateway / gateway.v3                    |
| ContactSensor                | magnet / sensor_magnet                  |
| MotionSensor                 | motion                                  |
| Button                       | switch / sensor_switch                  |
| TemperatureAndHumiditySensor | sensor_ht                               |
| SingleSwitch                 | ctrl_neutral1                           |
| DuplexSwitch                 | ctrl_neutral2                           |
| SingleSwitchLN               | ctrl_ln1 / ctrl_ln1.aq1                 |
| DuplexSwitchLN               | ctrl_ln2 / ctrl_ln2.aq1                 |
| SingleButton86               | 86sw1 / sensor_86sw1.aq1 / sensor_86sw1 |
| DuplexButton86               | 86sw2 / sensor_86sw2.aq1 / sensor_86sw2 |
| PlugBase                     | plug                                    |
| PlugBase86                   | 86plug / ctrl_86plug / ctrl_86plug.aq1  |
| MagicSquare                  | cube / sensor_cube / sensor_cube.aqgl01 |
| SmokeDetector                | smoke / sensor_smoke                    |
| NatgasDetector               | natgas / sensor_natgas                  |
| ElectricCurtain              | curtain                                 |
| ContactSensor2               | sensor_magnet.aq2                       |
| MotionSensor2                | sensor_motion.aq2                       |
| Button2                      | sensor_switch.aq2 / remote.b1acn01      |
| TemperatureAndHumiditySensor2 | weather.v1 / weather                    |
| WaterDetector                | sensor_wleak.aq1                        |
| Lock                         | lock.aq1                                |
| AcPartner                    | acpartner.v3                            |
| Button3                      | sensor_switch.aq3                       |
| DuplexButton862              | remote.b286acn01                        |
| VibrationSensor              | vibration                               |
| ElectricCurtainBattery       | curtain.hagl04                          |
