import type { API, Logging, PlatformConfig } from 'homebridge'
import type { Device } from '@homeiot/xiaomi'

export interface Context {
  log: Logging
  config: PlatformConfig
  api: API
  configured: Set<string>
}

export type CharacteristicModelValue = {
  name: string
  get: (propValue: any, device: Device) => any | Promise<any>
  set?: (characteristicValue: any, device: Device) => void | any | Promise<any>
}

export type CharacteristicModel = string
| ((device: Device) => string | CharacteristicModelValue | undefined)
| CharacteristicModelValue

export interface Model {
  id?: string
  name?: string
  service: string
  characteristics: {
    [characteristic: string]: CharacteristicModel
  }
}

export interface DeviceModelsMap {
  [device: string]: Model[]
}
