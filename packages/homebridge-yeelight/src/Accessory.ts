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
    accessory: PlatformAccessory,
    public readonly device: Device,
  ) {
    super(platform, accessory)

    let name = device.displayName
    const count = (Accessory.nameCount.get(name) || 0) + 1
    Accessory.nameCount.set(name, count)
    if (count > 1) name = `${ name } ${ count }`

    device
      .on('error', err => platform.log.error(err))
      .on('connect', () => platform.log.debug('[connect]', `${ name } ${ device.host }:${ device.port }`))
      .on('request', data => platform.log.debug('[request]', data))
      .on('response', data => platform.log.debug('[response]', data))

    this.setCharacteristic('AccessoryInformation.Manufacturer', Platform.platformName)
    this.setCharacteristic('AccessoryInformation.Model', device.modelName ?? device.model)
    this.setCharacteristic('AccessoryInformation.Name', name)
    this.setCharacteristic('AccessoryInformation.SerialNumber', device.id)
    this.setCharacteristic('AccessoryInformation.FirmwareRevision', device.fwVer)

    this.getService('Lightbulb', name)

    this.onCharacteristic('Lightbulb.On', {
      onGet: () => device.power === 'on',
      onSet: val => device.power = val ? 'on' : 'off',
    })

    this.onCharacteristic('Lightbulb.Brightness', {
      onGet: () => device.bright,
      onSet: val => device.bright = val,
    })

    if (device.supportColor) {
      this.onCharacteristic('Lightbulb.Hue', {
        onGet: () => device.hue,
        onSet: v => device.hue = v,
      })

      this.onCharacteristic('Lightbulb.Saturation', {
        onGet: () => device.sat,
        onSet: v => device.sat = v,
      })
    }

    if (device.supportColorTemperature) {
      this.onCharacteristic('LightBulb.ColorTemperature', {
        onGet: () => device.ct ? convertColorTemperature(device.ct) : undefined,
        onSet: v => device.ct = convertColorTemperature(v),
      })
        .setProps({
          maxValue: convertColorTemperature(device.supportColorTemperature.min),
          minValue: convertColorTemperature(device.supportColorTemperature.max),
        })
    }
  }

  public updateProps(info: Record<string, any>) {
    for (const [key, value] of Object.entries(info)) {
      switch (key) {
        case 'power':
          this.setCharacteristic('LightBulb.on', value === 'on')
          break
        case 'hue':
          this.setCharacteristic('LightBulb.Hue', value)
          break
        case 'sat':
          this.setCharacteristic('LightBulb.Saturation', value)
          break
        case 'bright':
          this.setCharacteristic('LightBulb.Brightness', value)
          break
        case 'ct':
          this.setCharacteristic('LightBulb.ColorTemperature', convertColorTemperature(value))
          break
      }
    }
  }
}
