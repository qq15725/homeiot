import { BaseAccessory } from '@homeiot/shared-homebridge'
import { Platform } from './Platform'
import type { Device } from '@homeiot/xiaomi'
import type { PlatformAccessory } from 'homebridge'

export class Accessory extends BaseAccessory {
  constructor(
    platform: Platform,
    accessory: PlatformAccessory,
    public readonly device: Device,
  ) {
    super(platform, accessory)
    device
      .on('error', err => this.log.error(err))
      .on('start', () => this.log.debug('[start]', `${ device.host }:${ device.port }`))
      .on('request', data => this.log.debug('[request]', `${ device.host }:${ device.port }`, data))
      .on('response', data => this.log.debug('[response]', `${ device.host }:${ device.port }`, data))
    this.setup().catch(err => this.log.error(err))
  }

  protected async setup() {
    await this.device.miIoInfo()
    this.setCharacteristic('AccessoryInformation.Manufacturer', Platform.platformName)
    this.setCharacteristic('AccessoryInformation.Model', this.device.model)
    this.setCharacteristic('AccessoryInformation.Name', this.device.model)
    this.setCharacteristic('AccessoryInformation.SerialNumber', this.device.id)
    this.setCharacteristic('AccessoryInformation.FirmwareRevision', this.device.fwVer)
    if (this.device.model?.includes('airpurifier')) {
      this.setupAirPurifier()
    }
  }

  protected async setupAirPurifier() {
    this.getService('AirPurifier', this.device.model)
    const [power] = await this.device.call('get_prop', ['power'])
    this.device.setAttribute('power', power)
    this.onCharacteristic('AirPurifier.Active', {
      onGet: () => this.device.getAttribute('power') === 'on'
        ? this.Characteristic.Active.ACTIVE
        : this.Characteristic.Active.INACTIVE,
      onSet: async val => {
        await this.device.call('set_power', [val ? 'on' : 'off'])
        this.device.setAttribute('power', val ? 'on' : 'off')
      },
    })
    this.onCharacteristic('AirPurifier.CurrentAirPurifierState', {
      onGet: () => this.Characteristic.CurrentAirPurifierState.PURIFYING_AIR,
    })
    this.onCharacteristic('AirPurifier.TargetAirPurifierState', {
      onGet: () => this.Characteristic.TargetAirPurifierState.MANUAL,
    })
  }

  public save() {
    this.accessory.context = this.device.getAttributes()
    super.save()
  }
}
