import type { API, Characteristic, Logging, PlatformAccessory, PlatformConfig, Service } from 'homebridge'
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
    api.on('didFinishLaunching', this.onDidFinishLaunching.bind(this))
  }

  protected abstract onDidFinishLaunching(): void

  protected abstract restoreAccessory(accessory: PlatformAccessory): T | undefined

  public configureAccessory(accessory: PlatformAccessory) {
    const { displayName, context } = accessory
    const { id, model } = context
    if (this.accessories.has(id)) {
      this.log.warn(`Ingnoring duplicate accessory from cache: ${ displayName } (${ model })`)
      return
    }
    this.log.info(`Loading accessory from cache: ${ displayName } (${ model })`)
    const val = this.restoreAccessory(accessory)
    if (val) {
      this.accessories.set(id, val)
    }
  }
}
