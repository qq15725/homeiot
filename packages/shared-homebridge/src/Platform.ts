import type { API, Characteristic, Logging, PlatformConfig, Service } from 'homebridge'
import type { Accessory } from './Accessory'

export abstract class Platform<T extends Accessory = Accessory> {
  public readonly accessories = new Map<string, T>()
  public readonly serviceClass: typeof Service
  public readonly characteristicClass: typeof Characteristic

  constructor(
    public readonly log: Logging,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.serviceClass = api.hap.Service
    this.characteristicClass = api.hap.Characteristic
  }
}
