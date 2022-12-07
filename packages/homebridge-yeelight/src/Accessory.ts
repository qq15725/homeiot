import { Accessory as BaseAccessory } from '@homeiot/shared-homebridge'
import { Platform } from './Platform'
import type { Device } from '@homeiot/yeelight'
import type { PlatformAccessory } from 'homebridge'

function convertColorTemperature(value: number): number {
  return Math.round(1_000_000 / value)
}

export class Accessory extends BaseAccessory {
  static readonly nameCount = new Map<string, number>()

  constructor(
    platform: Platform,
    platformAccessory: PlatformAccessory,
    public readonly device: Device,
  ) {
    super(platform, platformAccessory, { ...device.info })
    const info = device.info
    let name = device.spec.name
    const count = (Accessory.nameCount.get(name) || 0) + 1
    Accessory.nameCount.set(name, count)
    if (count > 1) name = `${ name } ${ count }`

    device
      .on('connected', () => platform.log.debug(`Connect to ${ device.host }:${ device.port }`))
      .on('sended', (str: string) => platform.log.debug(str))
      .on('updated', props => this.updateProps(props))

    this.updateProps(info)

    this
      .setInfo({
        manufacturer: Platform.platformName,
        model: device.spec.name,
        name,
        serialNumber: info.id,
        firmwareRevision: info.fwVer,
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

    if (device.spec.color) {
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

    if (device.spec.colorTemperature.min && device.spec.colorTemperature.max) {
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
        maxValue: convertColorTemperature(device.spec.colorTemperature.min),
        minValue: convertColorTemperature(device.spec.colorTemperature.max),
      })
    }
  }

  public updateProps(props: Record<string, any>) {
    const lightBulb = this.getOrAddService(this.serviceClass.Lightbulb)

    for (const [key, value] of Object.entries(props)) {
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
