import { Discovery } from '@homeiot/xiaomi'
import { Platform as BasePlatform } from '@homeiot/shared-homebridge'
import type { Accessory } from './Accessory'
import type { Device } from '@homeiot/xiaomi'
import type {
  API,
  DynamicPlatformPlugin,
} from 'homebridge'

export class Platform extends BasePlatform<Accessory> implements DynamicPlatformPlugin {
  public static readonly pluginIdentifier = '@homeiot/homebridge-xiaomi'
  public static readonly platformName = 'xiaomi'

  public static register(api: API) {
    api.registerPlatform(Platform.pluginIdentifier, Platform.platformName, Platform)
  }

  protected onDidFinishLaunching() {
    new Discovery()
      .on('started', () => this.log.debug('Discovery started'))
      .on('error', err => this.log.error(err))
      .on('missingToken', remote => this.log.error(remote))
      .on('discovered', this.onDiscovered.bind(this))
      .start()
      .catch(err => this.log.error(err))
  }

  restoreAccessory() {
    return undefined
  }

  private onDiscovered = (_device: Device) => {
    // const { info, spec } = device
    // const { id } = info
    // const name = info.name || spec.name
    //
    // if (!this.accessories.has(id)) {
    //   this.log(`Initializing new accessory ${ id } with name ${ name }...`)
    //   const uuid = this.api.hap.uuid.generate(id)
    //   // eslint-disable-next-line new-cap
    //   const accessory = new this.api.platformAccessory(name, uuid)
    //   accessory.context = { ...info }
    //   this.accessories.set(id, new Accessory(this, accessory, device))
    //   this.api.registerPlatformAccessories(Platform.pluginIdentifier, Platform.platformName, [accessory])
    // } else {
    //   this.accessories.get(id)!.updateProps(info)
    // }
  }
}
