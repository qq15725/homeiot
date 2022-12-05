import { Device, Discovery } from '@homeiot/yeelight'
import { PLATFORM, PLUGIN_NAME } from './constants'
import { Accessory } from './Accessory'
import type {
  API,
  DynamicPlatformPlugin,
  Logging,
  PlatformAccessory,
  PlatformConfig,
} from 'homebridge'

export class Platform implements DynamicPlatformPlugin {
  public readonly accessories = new Map<string, Accessory>()

  constructor(
    public readonly log: Logging,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing')
    const discovery = new Discovery()
    this.api.on('didFinishLaunching', async () => {
      this.log.debug('Executed didFinishLaunching callback')
      discovery.on('didDiscoverDevice', this.onDidDiscoverDevice.bind(this))
      await discovery.start()
      this.log.debug('Discovery Started')
    })
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    const { displayName, context } = accessory
    const { id, model } = context
    if (this.accessories.has(id)) {
      this.log.warn(`Ingnoring duplicate accessory from cache: ${ displayName } (${ model })`)
      return
    }
    this.log.info(`Loading accessory from cache: ${ displayName } (${ model })`)
    this.accessories.set(id, new Accessory(this, accessory, new Device(context as any)))
  }

  // called when a Yeelight has responded to the discovery query
  private onDidDiscoverDevice = (device: Device) => {
    const { info, spec } = device
    const { id } = info
    const name = info.name || spec.name

    if (!this.accessories.has(id)) {
      this.log(`Initializing new accessory ${ id } with name ${ name }...`)
      const uuid = this.api.hap.uuid.generate(id)
      // eslint-disable-next-line new-cap
      const accessory = new this.api.platformAccessory(name, uuid)
      accessory.context = { ...info }
      this.accessories.set(id, new Accessory(this, accessory, device))
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM, [accessory])
    }
  }
}
