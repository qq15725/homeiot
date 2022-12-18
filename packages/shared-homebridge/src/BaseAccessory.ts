import { EventEmitter } from '@homeiot/shared'
import type { Characteristic, PlatformAccessory, Service, WithUUID } from 'homebridge'
import type { BasePlatform } from './BasePlatform'

export abstract class BaseAccessory extends EventEmitter {
  public readonly serviceClass: typeof Service
  public readonly characteristicClass: typeof Characteristic

  constructor(
    public readonly platform: BasePlatform,
    public readonly platformAccessory: PlatformAccessory,
  ) {
    super()
    this.serviceClass = platform.serviceClass
    this.characteristicClass = platform.characteristicClass

    // Set configured name
    this.getInfoService()
      .getCharacteristic(this.characteristicClass.ConfiguredName)
      .on('set', (value, callback) => {
        const name = value.toString()
        this.setInfo({ name })
        this.platform.api.updatePlatformAccessories([this.platformAccessory])
        callback()
      })
  }

  public getOrAddService<T extends WithUUID<typeof Service>>(Klass: T): Service {
    return (
      this.platformAccessory.getService(Klass)
      || this.platformAccessory.addService(new (Klass as any)())
    ) as any
  }

  public getInfoService() {
    return this.getOrAddService(this.serviceClass.AccessoryInformation)
  }

  public setInfo(
    info: {
      manufacturer?: string
      model?: string
      name?: string
      serialNumber?: string
      firmwareRevision?: string
    },
  ): this {
    const service = this.getInfoService()
    if (info.manufacturer) service.updateCharacteristic(this.characteristicClass.Manufacturer, info.manufacturer)
    if (info.model) service.updateCharacteristic(this.characteristicClass.Model, info.model)
    if (info.name) service.updateCharacteristic(this.characteristicClass.Name, info.name)
    if (info.serialNumber) service.updateCharacteristic(this.characteristicClass.SerialNumber, info.serialNumber)
    if (info.firmwareRevision) service.updateCharacteristic(this.characteristicClass.FirmwareRevision, info.firmwareRevision)
    return this
  }

  protected onCharacteristic(
    characteristic: Characteristic,
    getter: () => any,
    setter: (value: any) => any,
  ) {
    return characteristic
      .on('get', async callback => {
        try {
          callback(null, await getter())
        } catch (e: any) {
          callback(e)
        }
      })
      .on('set', async (value, callback) => {
        try {
          await setter(value)
          callback(null)
        } catch (e: any) {
          callback(e)
        }
      })
  }
}
