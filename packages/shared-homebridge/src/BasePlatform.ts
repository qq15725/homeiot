import type { API, Characteristic, Logging, PlatformAccessory, PlatformConfig, Service } from 'homebridge'
import type { BaseAccessory } from './BaseAccessory'

export abstract class BasePlatform<T extends BaseAccessory = BaseAccessory> {
  public readonly Service: typeof Service
  public readonly Characteristic: typeof Characteristic
  public readonly accessories = new Map<string, T>()

  constructor(
    public readonly log: Logging,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.Service = api.hap.Service
    this.Characteristic = api.hap.Characteristic
    api.on('didFinishLaunching', this.onDidFinishLaunching.bind(this))
  }

  public configureAccessory(accessory: PlatformAccessory) {
    const { displayName, context } = accessory
    const id = String(context.id)
    if (!id || this.accessories.has(id)) {
      this.log.warn(`Ingnoring duplicate accessory from cache: ${ displayName }`)
    } else {
      this.log(`Loading accessory from cache: ${ displayName }`)
      this.onDidDiscoverAccessory(accessory)
    }
  }

  // overrideable
  protected onDidFinishLaunching() {}

  // overrideable
  protected onDidDiscoverAccessory(_accessory: PlatformAccessory) {}
}
