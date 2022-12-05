import { Device, Discovery } from '@homeiot/yeelight'
import { PLATFORM, PLUGIN_NAME } from './constants'
import { setupAccessory } from './accessory'
import type {
  API,
  DynamicPlatformPlugin,
  Logging,
  PlatformAccessory,
  PlatformConfig,
} from 'homebridge'

export class YeelightPlatform implements DynamicPlatformPlugin {
  public readonly accessories = new Map<string, PlatformAccessory>()
  public readonly devices = new Map<string, Device>()

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
    this.accessories.set(id, accessory)
    const device = new Device(context as any)
    this.devices.set(id, device)
    setupAccessory(this, accessory, device)
  }

  // called when a Yeelight has responded to the discovery query
  private onDidDiscoverDevice = (device: Device) => {
    const { info, spec } = device
    const { id } = info

    if (this.devices.has(id)) return
    this.devices.set(id, device)

    const name = info.name || spec.name

    let accessory = this.accessories.get(id)
    if (!accessory) {
      this.log(`Initializing new accessory ${ id } with name ${ name }...`)
      const uuid = this.api.hap.uuid.generate(id)
      // eslint-disable-next-line new-cap
      accessory = new this.api.platformAccessory(name, uuid)
      accessory.context = { ...info }
      this.accessories.set(id, accessory)
      setupAccessory(this, accessory, device)
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM, [accessory])
    }
  }
}
