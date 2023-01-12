import type { RequestInit } from 'node-fetch'

export interface Request {
  url: string
  init?: RequestInit
  context?: Record<string, any>
}

export interface ServiceLogger {
  info(message: string, ...parameters: any[]): void
  warn(message: string, ...parameters: any[]): void
  error(message: string, ...parameters: any[]): void
  debug(message: string, ...parameters: any[]): void
}

export interface ServiceToken {
  userId: number
  passToken: string
  ssecurity: string
  nonce: string
  location: string
  notificationUrl: string | undefined
  serviceToken: string
  userAgent: string
  deviceId: string
}

export interface ServiceConfig {
  username: string | null
  password: string | null
  useEncrypt: boolean
  country?: 'ru' | 'us' | 'tw' | 'sg' | 'cn' | 'de' | 'in' | 'i2' | string
  locale: 'en' | 'cn' | 'de' | 'i2' | 'ru' | 'sg' | 'us' | string
  serviceTokens: Record<string, ServiceToken>
  userAgent: string
  deviceId: string
  log?: ServiceLogger
}

export interface MIoTSpecPropertyValue {
  description: string
  value: number
}

export interface MIoTSpecProperty {
  iid: number
  type: string
  description: string
  access: ('read' | 'write' | 'notify')[]
  format: 'bool' | 'uint8' | 'uint16' | 'uint32' | 'int8' | 'int16' | 'int32' | 'int64' | 'float' | 'string' | 'hex'
  'value-list'?: MIoTSpecPropertyValue[]
  'value-range'?: number[]
  unit?: string
}

export interface MIoTSpecAction {
  iid: number
  type: string
  description: string
  in: number[]
  out: number[]
}

export interface MIoTSpecService {
  iid: number
  type: string
  description: string
  properties: MIoTSpecProperty[]
  actions?: MIoTSpecAction[]
}

export interface MIoTSpecInstance {
  type: string
  description: string
  services: MIoTSpecService[]
}

export interface MIoTSpecType {
  urn: 'urn'
  namespace: 'miot-spec-v2' | 'bluetooth-spec'
  type: 'template' | 'property' | 'action' | 'event' | 'service' | 'device'
  name: string
  value: number
  vendorProduct: string
  version: number
}
