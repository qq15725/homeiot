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
    this.setup().catch(err => this.log.error(err))
  }

  protected async setup() {
    const prefix = `${ this.device.host }:${ this.device.port }`

    await this.device
      .on('error', err => this.log.error(err))
      .on('start', () => this.log.debug('[start]', prefix))
      .on('request', data => this.log.debug('[request]', prefix, data))
      .on('response', data => this.log.debug('[response]', prefix, data))
      .setupInfo()

    this.setCharacteristic('AccessoryInformation.Manufacturer', Platform.platformName)
    this.setCharacteristic('AccessoryInformation.Model', this.device.get('model'))
    this.setCharacteristic('AccessoryInformation.Name', this.device.get('name') ?? this.device.get('model'))
    this.setCharacteristic('AccessoryInformation.SerialNumber', this.device.did)
    this.setCharacteristic('AccessoryInformation.FirmwareRevision', this.device.get('fw_ver') ?? this.device.get('extra.fw_version'))

    const model = this.device.model

    if (model?.includes('wifispeaker')) {
      this.setupWifispeaker()
    } else if (model?.includes('airpurifier')) {
      this.setupAirPurifier()
    }
  }

  protected async setupAirPurifier() {
    this.getService('AirPurifier', this.device.model)
    this.device.set('power', await this.device.getProp('power'))
    this.onCharacteristic('AirPurifier.Active', {
      onGet: () => this.device.get('power') === 'on'
        ? this.Characteristic.Active.ACTIVE
        : this.Characteristic.Active.INACTIVE,
      onSet: async val => {
        await this.device.setProp('power', val ? 'on' : 'off')
        this.device.set('power', val ? 'on' : 'off')
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
    this.accessory.context = this.device.toObject()
    super.save()
  }
}
