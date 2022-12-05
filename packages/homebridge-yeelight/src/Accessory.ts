import { Accessory as BaseAccessory } from '@homeiot/homebridge-shared'
import { Platform } from './Platform'
import type { Device } from '@homeiot/yeelight'
import type { PlatformAccessory } from 'homebridge'

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
      .on('command', (cmd: string) => platform.log(cmd))
      .on('props', (props: Record<string, any>) => {
        for (const [key, value] of Object.entries(props)) {
          this.attributes[key] = value
        }
      })

    this
      .setInfo({
        manufacturer: Platform.platformName,
        model: device.spec.name,
        name,
        serialNumber: info.id,
        firmwareRevision: info.fwVer,
      })
      .on('setAttribute', (key: string, value: any) => {
        switch (key) {
          case 'power':
            device.setPower(value)
            break
          case 'hue':
            device.setHsv(value, this.getAttribute('sat'))
            break
          case 'sat':
            device.setHsv(this.getAttribute('hue'), value)
            break
        }
      })

    // const lightBulb = accessory.getService(Service.Lightbulb)
    //   ?? accessory.addService(new Service.Lightbulb(name))
    const lightBulb = this.getOrAddService(this.serviceClass.Lightbulb)

    this.onCharacteristic(
      lightBulb.getCharacteristic(this.characteristicClass.On),
      () => this.getAttribute('power') === 'on',
      v => this.setAttribute('power', v ? 'on' : 'off'),
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
  }
}
