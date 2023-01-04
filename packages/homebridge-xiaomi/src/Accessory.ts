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
      .on('stop', () => this.log.debug('[stop]', prefix))
      .on('request', data => this.log.debug('[request]', prefix, data))
      .on('response', data => this.log.debug('[response]', prefix, data))
      .setupInfo()

    const model = this.device.get('model')

    this.setCharacteristic('AccessoryInformation.Manufacturer', Platform.platformName)
    this.setCharacteristic('AccessoryInformation.Model', model)
    this.setCharacteristic('AccessoryInformation.Name', this.device.get('name') ?? model)
    this.setCharacteristic('AccessoryInformation.SerialNumber', String(this.device.did))
    this.setCharacteristic('AccessoryInformation.FirmwareRevision', this.device.get('fw_ver') ?? this.device.get('extra.fw_version'))

    if (model?.includes('wifispeaker')) {
      this.setupWifispeaker()
    } else if (model?.includes('airpurifier')) {
      this.setupAirPurifier()
    }
  }

  protected async setupWifispeaker() {
    this.getService('SmartSpeaker', this.device.model)
    this.device.set('3.1', await this.device.getProp('3.1'))
    this.onCharacteristic('SmartSpeaker.CurrentMediaState', {
      onGet: () => this.device.get('3.1') === 1
        ? this.Characteristic.CurrentMediaState.PLAY
        : this.Characteristic.CurrentMediaState.STOP,
    })
    this.onCharacteristic('SmartSpeaker.TargetMediaState', {
      onGet: () => this.device.get('3.1') === 1
        ? this.Characteristic.CurrentMediaState.STOP
        : this.Characteristic.CurrentMediaState.PLAY,
      onSet: val => this.device.action(val ? '3.3' : '3.2'),
    })
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

  public save() {
    this.accessory.context = this.device.toObject()
    super.save()
  }
}
