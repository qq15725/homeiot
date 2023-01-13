import { Device } from '@homeiot/xiaomi'
import { deviceModelsMap, sharedModels } from './models'
import type { DeviceInfo } from '@homeiot/xiaomi'
import type { PlatformAccessory } from 'homebridge'
import type { CharacteristicModel, CharacteristicModelValue, Context } from './types'

export async function configureAccessory(
  accessory: PlatformAccessory<DeviceInfo>,
  platformContext: Context,
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

  if (!(device.specName in deviceModelsMap)) {
    return log(`Missing model map from accessory ${ did } with name ${ displayName }`)
  }

  await device.setupProps()

  const specName = device.specName!
  const models = [
    ...sharedModels,
    ...deviceModelsMap[specName],
  ]

  for (const model of models) {
    const { name = device.get('name') ?? specName, id, service: serviceKey } = model
    const Service = (api.hap.Service as any)[serviceKey]
    const service = (
      id
        ? accessory.getServiceById(Service, id)
        : accessory.getService(Service)
    ) || accessory.addService(new Service(name, id))
    for (const [characteristicKey, characteristicModel] of Object.entries(model.characteristics)) {
      const value = parseCharacteristicModel(characteristicModel, device)
      if (!value) continue
      const characteristic = service.getCharacteristic(
        (api.hap.Characteristic as any)[characteristicKey],
      )
      const onGet = () => value.get(device.get(value.name), device)
      characteristic
        .onGet(onGet)
        .updateValue(onGet())
      if (value.set) {
        characteristic.onSet(async val => {
          try {
            val = await value.set!(val, device)
            if (val !== undefined) {
              await device.setProp(value.name, val)
              device.set(value.name, val)
            }
          } catch (err: any) {
            log.error(err)
          }
        })
      }
    }
  }
}

export function parseCharacteristicModel(prop: CharacteristicModel, device: Device): CharacteristicModelValue | undefined {
  if (typeof prop === 'string') {
    return {
      name: prop,
      get: v => v,
      set: v => v,
    }
  }
  if (typeof prop === 'function') {
    const value = prop(device)
    if (typeof value === 'string') {
      return parseCharacteristicModel(value, device)
    }
    return value
  }
  return prop
}
