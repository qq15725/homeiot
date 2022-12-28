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
