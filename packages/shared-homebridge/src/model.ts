import type { API, Logging, PlatformAccessory, PlatformConfig } from 'homebridge'
import type { ModelService } from './model-service'

export interface ModelEnv<T> {
  log: Logging
  config: PlatformConfig
  api: API
  device: T
}

export interface Model {
  services: (ModelService | false)[]
}

export type ModelFn<T> = (env: ModelEnv<T>) => Model | Promise<Model>
export type ModelExport<T> = Model | Promise<Model> | ModelFn<T>

export function defineBaseModel<T>(model: ModelExport<T>): ModelExport<T> {
  return model
}

export async function bindModelToAccessory<T>(
  model: ModelExport<T>,
  accessory: PlatformAccessory,
  env: ModelEnv<T>,
) {
  const { services } = typeof model === 'function'
    ? await model(env)
    : await model

  services.forEach(modelService => {
    if (!modelService) return

    const { uuid: ServiceClass, displayName, subType, characteristics } = modelService

    const service = (
      subType
        ? accessory.getServiceById(ServiceClass, subType)
        : accessory.getService(ServiceClass)
    ) || accessory.addService(new ServiceClass(displayName, subType))

    characteristics?.forEach(modelCharacteristic => {
      if (!modelCharacteristic) return

      const { uuid, value, get, set } = modelCharacteristic
      const characteristic = service.getCharacteristic(uuid)
      const env = { service, characteristic }
      if (value !== undefined) characteristic.updateValue(value)
      if (get) characteristic.onGet(() => get(env))
      if (set) characteristic.onSet(val => set(val, env))
    })
  })
}
