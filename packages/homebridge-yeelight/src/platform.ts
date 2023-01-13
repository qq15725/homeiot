import { Discovery } from '@homeiot/yeelight'
import { configureAccessory } from './accessory'
import { platformId, platformName } from './constants'
import type { Context } from './types'
import type {
  API,
  Logging,
  PlatformAccessory,
  PlatformConfig,
} from 'homebridge'
import type { Device, DeviceInfo } from '@homeiot/yeelight'

export function createPlatform(log: Logging, config: PlatformConfig, api: API) {
  const configured = new Set<string>()
  const context: Context = { log, config, api, configured }
  const uuid = api.hap.uuid.generate
  const PlatformAccessory = api.platformAccessory

  api.on('didFinishLaunching', async () => {
    new Discovery()
      .on('error', err => log.error(err))
      .on('start', () => log.debug('Local discovery started'))
      .on('device', (device: Device) => tryRegisterDeviceAsAnAccessory(device.toObject()))
      .start()
  })

  function tryRegisterDeviceAsAnAccessory(deviceInfo: DeviceInfo) {
    const id = String(deviceInfo.id)
    if (!id || configured.has(id)) return
    const name = deviceInfo.name ?? id
    const accessory = new PlatformAccessory<DeviceInfo>(name, uuid(id))
    accessory.context = deviceInfo
    api.registerPlatformAccessories(platformId, platformName, [accessory])
    configureAccessory(accessory, context, true)
  }

  return {
    configureAccessory: (accessory: PlatformAccessory<DeviceInfo>) => {
      configureAccessory(accessory, context)
    },
  }
}
