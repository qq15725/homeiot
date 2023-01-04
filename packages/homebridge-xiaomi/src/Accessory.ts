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
    await this.device.getInfo()
    await this.setupInfo()
    const model = this.device.model
    if (model?.includes('wifispeaker')) {
      this.setupWifispeaker()
    } else if (model?.includes('airpurifier')) {
      this.setupAirPurifier()
    }
  }

  protected async setupInfo() {
    this.setCharacteristic('AccessoryInformation.Manufacturer', Platform.platformName)
    this.setCharacteristic('AccessoryInformation.Model', this.device.getAttribute('model'))
    this.setCharacteristic('AccessoryInformation.Name', this.device.getAttribute('name') ?? this.device.getAttribute('model'))
    this.setCharacteristic('AccessoryInformation.SerialNumber', this.device.did)
    this.setCharacteristic('AccessoryInformation.FirmwareRevision', this.device.getAttribute('fw_ver') ?? this.device.getAttribute('extra.fw_version'))
  }

  protected async setupAirPurifier() {
    this.getService('AirPurifier', this.device.model)
    this.device.setAttribute('power', await this.device.getProp('power'))
    this.onCharacteristic('AirPurifier.Active', {
      onGet: () => this.device.getAttribute('power') === 'on'
        ? this.Characteristic.Active.ACTIVE
        : this.Characteristic.Active.INACTIVE,
      onSet: async val => {
        await this.device.setProp('power', val ? 'on' : 'off')
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

  protected async setupWifispeaker() {

  }

  public save() {
    this.accessory.context = this.device.getAttributes()
    super.save()
  }
}
