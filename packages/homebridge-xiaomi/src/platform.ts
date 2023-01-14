import { Discovery, Service } from '@homeiot/xiaomi'
import { configureAccessory } from './accessory'
import { platformId, platformName } from './constants'
import type { Device, DeviceInfo } from '@homeiot/xiaomi'
import type {
  API,
  Logging,
  PlatformAccessory,
  PlatformConfig,
} from 'homebridge'

export interface PlatformContext {
  log: Logging
  config: PlatformConfig
  api: API
  configured: Set<string>
}

export function createPlatform(log: Logging, config: PlatformConfig, api: API) {
  const configured = new Set<string>()
  const context: PlatformContext = { log, config, api, configured }
  const { serviceTokens } = config
  const uuid = api.hap.uuid.generate
  const PlatformAccessory = api.platformAccessory

  api.on('didFinishLaunching', async () => {
    try {
      const service = new Service({ serviceTokens })
      const devices = await service.miio.getDevices()
      devices.forEach(deviceInfo => tryRegisterDeviceAsAnAccessory(deviceInfo as any))
    } catch (err) {
      new Discovery()
        .on('error', err => log.error(err))
        .on('start', () => log.debug('Local discovery started'))
        .on('device', (device: Device) => tryRegisterDeviceAsAnAccessory(device.toObject()))
        .start()
    }
  })

  function tryRegisterDeviceAsAnAccessory(deviceInfo: DeviceInfo) {
    const did = String(deviceInfo.did)
    if (!did || configured.has(did)) return
    const name = deviceInfo.name ?? did
    const accessory = new PlatformAccessory<DeviceInfo>(name, uuid(did))
    accessory.context = deviceInfo
    api.registerPlatformAccessories(platformId, platformName!, [accessory])
    configureAccessory(accessory, context, true)
  }

  return {
    configureAccessory: (accessory: PlatformAccessory<DeviceInfo>) => {
      configureAccessory(accessory, context)
    },
  }
}
