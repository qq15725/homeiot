import { Device, Discovery } from '@homeiot/xiaomi'
import { BasePlatform } from '@homeiot/shared-homebridge'
import { Accessory } from './Accessory'
import type {
  API,
  DynamicPlatformPlugin,
  PlatformAccessory,
} from 'homebridge'

export class Platform extends BasePlatform<Accessory> implements DynamicPlatformPlugin {
  public static readonly pluginIdentifier = '@homeiot/homebridge-xiaomi'
  public static readonly platformName = 'xiaomi'

  public static register(api: API) {
    api.registerPlatform(Platform.pluginIdentifier, Platform.platformName, Platform)
  }

  protected onDidFinishLaunching() {
    new Discovery()
      .on('error', err => this.log.error(err))
      .on('start', () => this.log.debug('Local discovery started'))
      .on('device', this.onDidDiscoverDevice.bind(this))
      .start()
  }

  protected onDidDiscoverDevice(device: Device) {
    const id = device.id
    if (!this.config.tokens[id]) return
    // eslint-disable-next-line new-cap
    const accessory = new this.api.platformAccessory(id, this.api.hap.uuid.generate(id))
    accessory.context = device.getAttributes()
    if (!this.accessories.has(id)) {
      this.log(`Initializing new accessory ${ id } with name ${ id }...`)
      this.api.registerPlatformAccessories(Platform.pluginIdentifier, Platform.platformName, [accessory])
    }
    this.onDidDiscoverAccessory(accessory)
  }

  protected onDidDiscoverAccessory(accessory: PlatformAccessory) {
    const { context } = accessory
    const { id } = context
    if (!id) return
    if (this.accessories.has(id)) {
      //
    } else {
      const device = new Device({ ...context } as any)
      if (!device.token) {
        const token = this.config.tokens[id]
        if (!token) return
        device.setToken(token)
      }
      this.accessories.set(id, new Accessory(this, accessory, device))
    }
  }
}
