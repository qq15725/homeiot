import { BaseAccessory } from '@homeiot/shared-homebridge'
import { Platform } from './Platform'
import type { Device } from '@homeiot/yeelight'
import type { PlatformAccessory } from 'homebridge'

function convertColorTemperature(value: number): number {
  return Math.round(1_000_000 / value)
}

export class Accessory extends BaseAccessory {
  private static readonly nameCount = new Map<string, number>()

  constructor(
    platform: Platform,
    platformAccessory: PlatformAccessory,
    public readonly device: Device,
  ) {
    super(platform, platformAccessory)
    let name = device.displayName
    const count = (Accessory.nameCount.get(name) || 0) + 1
    Accessory.nameCount.set(name, count)
    if (count > 1) name = `${ name } ${ count }`

    device
      .on('error', err => platform.log.error(err))
      .on('connect', () => platform.log.debug('[connect]', `${ name } ${ device.host }:${ device.port }`))
      .on('request', data => platform.log.debug('[request]', data))
      .on('response', data => platform.log.debug('[response]', data))
      .connect()

    this
      .setInfo({
        manufacturer: Platform.platformName,
        model: device.modelName ?? device.model,
        name,
        serialNumber: device.id,
        firmwareRevision: device.fwVer,
      })

    const lightBulb = this.platformAccessory.getService(this.serviceClass.Lightbulb)
      ?? this.platformAccessory.addService(new this.serviceClass.Lightbulb(name))

    this.onCharacteristic(
      lightBulb.getCharacteristic(this.characteristicClass.On),
      () => device.power === 'on',
      val => device.power = val ? 'on' : 'off',
    )

    this.onCharacteristic(
      lightBulb.getCharacteristic(this.characteristicClass.Brightness),
      () => device.bright,
      val => device.bright = val,
    )

    if (device.supportColor) {
      this.onCharacteristic(
        lightBulb.getCharacteristic(this.characteristicClass.Hue),
        () => device.hue,
        v => device.hue = v,
      )

      this.onCharacteristic(
        lightBulb.getCharacteristic(this.characteristicClass.Saturation),
        () => device.sat,
        v => device.sat = v,
      )
    }

    if (device.supportColorTemperature) {
      const characteristic = (
        lightBulb.getCharacteristic(this.characteristicClass.ColorTemperature)
        || lightBulb.addOptionalCharacteristic(this.characteristicClass.ColorTemperature)
      )

      this.onCharacteristic(
        characteristic,
        () => device.ct ? convertColorTemperature(device.ct) : undefined,
        v => device.ct = convertColorTemperature(v),
      )

      characteristic.setProps({
        maxValue: convertColorTemperature(device.supportColorTemperature.min),
        minValue: convertColorTemperature(device.supportColorTemperature.max),
      })
    }
  }

  public updateProps(info: Record<string, any>) {
    const lightBulb = this.getOrAddService(this.serviceClass.Lightbulb)

    for (const [key, value] of Object.entries(info)) {
      switch (key) {
        case 'power':
          lightBulb.updateCharacteristic(this.characteristicClass.On, value === 'on')
          break
        case 'hue':
          lightBulb.updateCharacteristic(this.characteristicClass.Hue, value)
          break
        case 'sat':
          lightBulb.updateCharacteristic(this.characteristicClass.Saturation, value)
          break
        case 'bright':
          lightBulb.updateCharacteristic(this.characteristicClass.Brightness, value)
          break
        case 'ct':
          lightBulb.updateCharacteristic(this.characteristicClass.ColorTemperature, convertColorTemperature(value))
          break
      }
    }
  }
}
