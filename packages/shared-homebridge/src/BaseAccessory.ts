import { EventEmitter } from '@homeiot/shared'
import type { Characteristic, PlatformAccessory, Service } from 'homebridge'
import type { BasePlatform } from './BasePlatform'

export abstract class BaseAccessory extends EventEmitter {
  public get log() {
    return this.platform.log
  }

  public get config() {
    return this.platform.config
  }

  public get api() {
    return this.platform.api
  }

  public get Service() {
    return this.platform.Service
  }

  public get Characteristic() {
    return this.platform.Characteristic
  }

  constructor(
    public readonly platform: BasePlatform,
    public readonly accessory: PlatformAccessory,
  ) {
    super()
    this.onCharacteristic('AccessoryInformation.ConfiguredName', {
      onSet: name => {
        this.setCharacteristic('AccessoryInformation.Name', name)
        this.save()
      },
    })
  }

  public getService(key: string, ...args: any[]): Service {
    const Klass = (this.Service as any)[key]
    return this.accessory.getService(Klass)
      || this.accessory.addService(new Klass(...args))
  }

  public getCharacteristic(key: string): Characteristic {
    const [key1, key2] = key.split('.')
    const service = this.getService(key1)
    const klass = (this.Characteristic as any)[key2]
    return service.getCharacteristic(klass) as Characteristic
  }

  public onCharacteristic(
    key: string,
    options?: {
      onGet?: () => any | Promise<any>
      onSet?: (value: any) => any | Promise<any>
    },
  ): Characteristic {
    const { onGet, onSet } = options ?? {}
    const characteristic = this.getCharacteristic(key)
    onGet && characteristic.onGet(onGet)
    onSet && characteristic.onSet(async (value) => {
      await onSet(value)
    })
    return characteristic
  }

  public setCharacteristic(key: string, value: any) {
    this.getCharacteristic(key)
      .updateValue(value)
  }

  public save() {
    this.api.updatePlatformAccessories([this.accessory])
  }
}
