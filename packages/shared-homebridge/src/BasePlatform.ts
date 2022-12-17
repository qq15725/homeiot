import type { API, Characteristic, Logging, PlatformAccessory, PlatformConfig, Service } from 'homebridge'
import type { BaseAccessory } from './BaseAccessory'

export abstract class BasePlatform<T extends BaseAccessory = BaseAccessory> {
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
    api.on('didFinishLaunching', this.onDidFinishLaunching.bind(this))
  }

  protected abstract getId(context: any): string | undefined

  protected abstract onDidFinishLaunching(): void

  protected abstract onDidDiscoverAccessory(accessory: PlatformAccessory): void

  public configureAccessory(accessory: PlatformAccessory) {
    const { displayName, context } = accessory
    const id = this.getId(context)
    if (!id) return
    if (this.accessories.has(id)) {
      this.log.warn(`Ingnoring duplicate accessory from cache: ${ displayName }`)
    } else {
      this.log.info(`Loading accessory from cache: ${ displayName }`)
      this.onDidDiscoverAccessory(accessory)
    }
  }
}
