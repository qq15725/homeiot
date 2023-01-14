import type {
  Characteristic,
  CharacteristicValue,
  Nullable,
  Service,
} from 'homebridge'

export interface ModelCharacteristicEnv {
  service: Service
  characteristic: Characteristic
}

export interface ModelCharacteristic {
  uuid?: any
  value?: Nullable<CharacteristicValue>
  get?: (env: ModelCharacteristicEnv) => Promise<Nullable<CharacteristicValue>> | Nullable<CharacteristicValue>
  set?: (value: CharacteristicValue, env: ModelCharacteristicEnv) => Promise<Nullable<CharacteristicValue> | void> | Nullable<CharacteristicValue> | void
}
