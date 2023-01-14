import { Device } from '@homeiot/xiaomi'
import { bindModelToAccessory } from '@homeiot/shared-homebridge'
import { models } from './models'
import type { DeviceInfo } from '@homeiot/xiaomi'
import type { PlatformAccessory } from 'homebridge'
import type { PlatformContext } from './platform'

export async function configureAccessory(
  accessory: PlatformAccessory<DeviceInfo>,
  platformContext: PlatformContext,
  wasRecentlyCreated = false,
) {
  const { log, config, api, configured } = platformContext
  const { serviceTokens } = config
  const { displayName, context: deviceInfo } = accessory

  const did = String(deviceInfo.did)

  if (!did || configured.has(did)) {
    log.warn(`Ingnoring duplicate accessory ${ did } with name ${ displayName }`)
    return
  }

  configured.add(did)

  const device = new Device({
    serviceTokens,
    ...deviceInfo,
  })

  const prefix = `${ device.host }:${ device.port } ${ displayName }`

  device
    .on('error', err => log.error(err))
    .on('start', () => log.debug('[start]', prefix))
    .on('stop', () => log.debug('[stop]', prefix))
    .on('request', data => log.debug('[request]', prefix, JSON.stringify(data)))
    .on('response', data => log.debug('[response]', prefix, JSON.stringify(data)))

  if (wasRecentlyCreated) {
    log(`Initializing new accessory ${ did } with name ${ displayName }...`)
    try {
      await device.setupInfo()
      await device.setupSpec()
      accessory.context = device.toObject()
      api.updatePlatformAccessories([accessory])
    } catch (err: any) {
      log.error(err)
    }
  } else {
    log(`Loading accessory from cache: ${ displayName }`)
  }

  if (!device.specName) {
    return log(`Missing spec name from accessory ${ did } with name ${ displayName }`)
  }

  if (!(device.specName in models)) {
    return log(`Missing model map from accessory ${ did } with name ${ displayName }`)
  }

  await device.setupProps()

  const model = models[device.specName! as keyof typeof models]

  bindModelToAccessory(model, accessory, { log, config, api, device })
}
