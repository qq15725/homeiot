import { randomString } from './utils'
import { Account } from './Account'
import { MiIO } from './MiIO'
import { MIoT } from './MIoT'
import { Mina } from './Mina'
import { MIoTSpec } from './MIoTSpec'
import type { AccessToken } from './AccessToken'

export interface Logger {
  info(message: string, ...parameters: any[]): void
  warn(message: string, ...parameters: any[]): void
  error(message: string, ...parameters: any[]): void
  debug(message: string, ...parameters: any[]): void
}

export interface CloudConfig {
  username: string | null
  password: string | null
  useEncrypt: boolean
  country?: 'ru' | 'us' | 'tw' | 'sg' | 'cn' | 'de' | 'in' | 'i2' | string
  locale: 'en' | 'cn' | 'de' | 'i2' | 'ru' | 'sg' | 'us' | string
  accessTokens: Record<string, AccessToken>
  userAgent: string
  deviceId: string
  log?: Logger
}

export class Cloud {
  public config: CloudConfig
  public account: Account
  public miio: MiIO
  public miot: MIoT
  public miotSpec: MIoTSpec
  public mina: Mina

  constructor(options?: Partial<CloudConfig>) {
    this.config = {
      username: null,
      password: null,
      useEncrypt: true,
      locale: 'en',
      accessTokens: {},
      userAgent: `Android-7.1.1-1.0.0-ONEPLUS A3010-136-${ randomString(13, 'ABCDEF') } APP/xiaomi.smarthome APPV/62830`,
      deviceId: randomString(6, 'ALPHABETIC'),
      ...options,
    }
    this.account = new Account(this)
    this.miio = new MiIO(this)
    this.miot = new MIoT(this)
    this.miotSpec = new MIoTSpec(this)
    this.mina = new Mina(this)
  }
}
