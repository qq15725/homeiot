import { BaseDevice } from '@homeiot/shared'
import { Protocol } from './protocol'
import { Service } from './service'
import type { DeviceInfo } from './types'

export class Device extends BaseDevice {
  public get id(): string {
    return `xiaomi_${ this.did }`
  }

  public get did(): number {
    return this.get('did')
  }

  public get token(): string | undefined {
    return this.get('token')
  }

  public get stamp(): number | undefined {
    return this.get('stamp')
  }

  public get timestamp(): number | undefined {
    return this.get('timestamp')
  }

  public get model(): string | undefined {
    return this.get('model')
  }

  public readonly protocol: Protocol
  public readonly service: Service

  constructor(info: DeviceInfo) {
    const { host = '0.0.0.0', port = 54321, serviceTokens, ...attributes } = info
    super(host, port, attributes, { type: 'udp4' })
    if (this.stamp) {
      this.set('timestamp', Date.now())
    }
    this.protocol = new Protocol(this.did, this.token)
    this.service = new Service({ serviceTokens })
  }

  public setToken(token: string) {
    this.set('token', token)
    this.protocol.miio.setToken(token)
  }

  public async call(
    method: string,
    params: any = [],
    options?: {
      keepAlive?: boolean
      timeout?: number
    },
  ): Promise<any> {
    if (!this.stamp) {
      await this.request(this.protocol.miio.helloPacket, { uuid: 'hello' })
    }
    const id = this.uuid()
    const data = `${ JSON.stringify({ id, method, params }) }\r\n`
    return this.request(data, { ...options, uuid: String(id) }).then(val => val.result)
  }

  public send(data: string | Buffer) {
    if (typeof data === 'string') {
      const packet = this.protocol.miio.encode(
        data,
        this.stamp! + Math.floor((Date.now() - this.timestamp!) / 1000),
      )
      if (!packet) {
        return Promise.reject(new Error('Token is required to call method'))
      }
      data = packet
    }
    return super.send(data)
  }

  protected onMessage(packet: Buffer) {
    const data = this.protocol.miio.decode(packet)
    if (!data) return
    if (data.stamp > 0) {
      this.set('stamp', data.stamp)
      this.set('timestamp', Date.now())
      this.getWaitingRequest('hello')?.resolve()
    }
    if (!data.decrypted) return
    const message = JSON.parse(data.decrypted)
    const id = String(message.id)
    if ('id' in message && 'result' in message) {
      this.getWaitingRequest(id)?.resolve(message)
    } else if (
      'id' in message
      && 'error' in message
      && 'code' in message.error
      && 'message' in message.error
    ) {
      this.getWaitingRequest(id)?.reject(message.error.message)
    }
  }

  public async setupInfo() {
    const attributes = await this.getInfo()
    for (const [key, val] of Object.entries(attributes)) {
      this.set(key, val)
    }
  }

  public getInfo() {
    return this.token
      ? this.call('miIO.info')
      : this.service.miio.getDevice(this.did)
  }

  public getSpec() {
    return this.service.miotSpec.find(this.model!)
  }

  protected resovleIid(iid: string) {
    const [siid, piid] = iid
      .replace(/^0\./, '')
      .split('.')
    return { siid: Number(siid), piid: Number(piid) }
  }

  public getProps(keys: string[]) {
    if (this.token) {
      return this.call('get_properties', keys.map(iid => {
        const { siid, piid } = this.resovleIid(iid)
        return { did: String(this.did), siid, piid }
      }))
    } else {
      return this.service.miot.getProps(this.did, keys)
    }
  }

  public async getProp(key: string) {
    if (key.includes('.')) {
      return this.getProps([key]).then(res => res[0])
    } else {
      return this.call('get_prop', [key]).then(res => res[0])
    }
  }

  public setProps(props: [string, any][]) {
    if (this.token) {
      return this.call('set_properties', props.map(val => {
        const { siid, piid } = this.resovleIid(val[0])
        return { did: String(this.did), siid, piid, value: val[1] }
      }))
    } else {
      return this.service.miot.setProps(this.did, props)
    }
  }

  public async setProp(key: string, value: any) {
    if (key.includes('.')) {
      return this.setProps([[key, value]]).then(res => res[0])
    } else {
      return this.call(`set_${ key }`, [value])
    }
  }

  public action(key: string, args: any[]) {
    if (this.token) {
      const { siid, piid } = this.resovleIid(key)
      return this.call('action', {
        did: String(this.did), siid, aiid: piid, in: args,
      })
    } else {
      return this.service.miot.action(this.did, key, args)
    }
  }
}
