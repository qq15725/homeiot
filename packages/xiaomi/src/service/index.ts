import EventEmitter from 'events'
import { randomString } from './utils'
import { Account } from './Account'
import { MiIO } from './MiIO'
import { MIoT } from './MIoT'
import { Mina } from './Mina'
import { MIoTSpec } from './MIoTSpec'
import type { ServiceConfig } from './types'

export class Service extends EventEmitter {
  public config: ServiceConfig
  public account: Account
  public miio: MiIO
  public miot: MIoT
  public miotSpec: MIoTSpec
  public mina: Mina

  constructor(options?: Partial<ServiceConfig>) {
    super()
    this.config = {
      username: null,
      password: null,
      useEncrypt: true,
      locale: 'en',
      serviceTokens: {},
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

export * from './types'
