import type { ServiceToken } from './service'

export interface DeviceInfo {
  [key: string]: any
  did: number
  stamp?: number
  host?: string
  port?: number
  token?: string
  serviceTokens?: Record<string, ServiceToken>
}
