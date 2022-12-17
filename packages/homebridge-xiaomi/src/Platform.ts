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

  protected getId(context: any) {
    return context.did ? String(context.did) : undefined
  }

  protected onDidFinishLaunching() {
    new Discovery()
      .on('error', err => this.log.error(err))
      .on('didFinishLaunching', () => this.log.debug('Discovery started'))
      .on('didDiscoverDevice', this.onDidDiscoverDevice.bind(this))
      .on('missingToken', remote => this.log.error(remote))
      .start()
      .catch(err => this.log.error(err))
  }

  protected onDidDiscoverDevice(device: Device) {
    const { did } = device
    const id = this.getId(device)
    if (!id) return
    // eslint-disable-next-line new-cap
    const accessory = new this.api.platformAccessory(
      String(did),
      this.api.hap.uuid.generate(id),
    )
    accessory.context = { ...device }
    if (!this.accessories.has(id)) {
      this.log(`Initializing new accessory ${ id } with name ${ did }...`)
      this.api.registerPlatformAccessories(Platform.pluginIdentifier, Platform.platformName, [accessory])
    }
    this.onDidDiscoverAccessory(accessory)
  }

  protected onDidDiscoverAccessory(accessory: PlatformAccessory) {
    const { context } = accessory
    const id = this.getId(context)
    if (!id) return
    if (this.accessories.has(id)) {
      //
    } else {
      this.accessories.set(id, new Accessory(this, accessory, new Device({ ...context } as any)))
    }
  }
}
