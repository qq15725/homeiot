import { Accessory as BaseAccessory } from '@homeiot/shared-homebridge'
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
    super(platform, platformAccessory, { ...device })
    let name = device.displayName
    const count = (Accessory.nameCount.get(name) || 0) + 1
    Accessory.nameCount.set(name, count)
    if (count > 1) name = `${ name } ${ count }`

    device
      .on('connected', () => platform.log.debug(`Connect to ${ device.host }:${ device.port }`))
      .on('sended', (str: string) => platform.log.debug(str))
      .on('updated', props => this.updateProps(props))

    this.updateProps(device)

    this
      .setInfo({
        manufacturer: Platform.platformName,
        model: device.modelName ?? device.model,
        name,
        serialNumber: device.id,
        firmwareRevision: device.fwVer,
      })
      .on('setAttribute', async (key: string, value: any) => {
        try {
          switch (key) {
            case 'power':
              await device.setPower(value)
              break
            case 'hue':
              await device.setHsv(value, this.getAttribute('sat'))
              break
            case 'sat':
              await device.setHsv(this.getAttribute('hue'), value)
              break
            case 'bright':
              await device.setBright(Math.max(value, 1))
              break
            case 'ct':
              await device.setCtAbx(value)
              break
          }
        } catch (e: any) {
          platform.log.error(e)
        }
      })

    const lightBulb = this.getOrAddService(this.serviceClass.Lightbulb)
    // const lightBulb = accessory.getService(Service.Lightbulb)
    //   ?? accessory.addService(new Service.Lightbulb(name))

    this.onCharacteristic(
      lightBulb.getCharacteristic(this.characteristicClass.On),
      () => this.getAttribute('power') === 'on',
      v => this.setAttribute('power', v ? 'on' : 'off'),
    )

    this.onCharacteristic(
      lightBulb.getCharacteristic(this.characteristicClass.Brightness),
      () => this.getAttribute('bright'),
      v => this.setAttribute('bright', v),
    )

    if (device.supportsColor) {
      this.onCharacteristic(
        lightBulb.getCharacteristic(this.characteristicClass.Hue),
        () => this.getAttribute('hue'),
        v => this.setAttribute('hue', v),
      )

      this.onCharacteristic(
        lightBulb.getCharacteristic(this.characteristicClass.Saturation),
        () => this.getAttribute('sat'),
        v => this.setAttribute('sat', v),
      )
    }

    if (device.supportsColorTemperature) {
      const characteristic = (
        lightBulb.getCharacteristic(this.characteristicClass.ColorTemperature)
        || lightBulb.addOptionalCharacteristic(this.characteristicClass.ColorTemperature)
      )

      this.onCharacteristic(
        characteristic,
        () => convertColorTemperature(this.getAttribute('ct')),
        v => this.setAttribute('ct', convertColorTemperature(v)),
      )

      characteristic.setProps({
        maxValue: convertColorTemperature(device.supportsColorTemperature.min),
        minValue: convertColorTemperature(device.supportsColorTemperature.max),
      })
    }
  }

  public updateProps(info: Record<string, any>) {
    const lightBulb = this.getOrAddService(this.serviceClass.Lightbulb)

    for (const [key, value] of Object.entries(info)) {
      this.attributes[key] = value
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
