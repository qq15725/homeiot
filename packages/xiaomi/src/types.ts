// local

export interface DeviceInfo {
  id: number
  host: string
  port?: number
  token?: string
  serverStamp?: number
  serverStampTime?: number
}

// miio

export interface DecodedPacket {
  deviceId: number
  stamp: number
  checksum: Buffer
  encrypted: Buffer
  decrypted?: string
}

// miot

export interface PropertyValue {
  description: string
  value: number
}

export interface Property {
  access: ('read' | 'write' | 'notify')[]
  description: string
  format: 'bool' | 'uint8' | 'uint16' | 'uint32' | 'int8' | 'int16' | 'int32' | 'int64' | 'float' | 'string' | 'hex'
  iid: number
  type: string
  'value-list'?: PropertyValue[]
  'value-range'?: number[]
  unit?: string
}

export interface Service {
  description: string
  iid: number
  properties: Property[]
  type: string
}

export interface Instance {
  description: string
  services: Service[]
  type: string
}

export interface SpecificationType {
  urn: 'urn'
  namespace: 'miot-spec-v2' | 'bluetooth-spec'
  type: 'template' | 'property' | 'action' | 'event' | 'service' | 'device'
  name: string
  value: number
  vendorProduct: string
  version: number
}

export type InstanceProperties = Record<string, {
  siid: number
} & Property>

// cloud

export interface CloudOptions {
  username: string
  password: string
  country?: 'ru' | 'us' | 'tw' | 'sg' | 'cn' | 'de' | 'in' | 'i2' | string
  locale?: 'cn' | 'de' | 'i2' | 'ru' | 'sg' | 'us' | string
}
