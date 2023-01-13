import type { API, Logging, PlatformConfig } from 'homebridge'

export interface Context {
  log: Logging
  config: PlatformConfig
  api: API
  configured: Set<string>
}
