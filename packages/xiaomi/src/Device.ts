import { BaseDevice } from '@homeiot/shared'
import { MiIO } from './MiIO'
import { Service } from './service'
import type { DeviceInfo } from './types'

export class Device extends BaseDevice {
  public get id(): string {
    return `xiaomi_${ this.did }`
  }

  public get did(): number {
    return this.getAttribute('did')
  }

  public get token(): string | undefined {
    return this.getAttribute('token')
  }

  public get stamp(): number | undefined {
    return this.getAttribute('stamp')
  }

  public get timestamp(): number | undefined {
    return this.getAttribute('timestamp')
  }

  public get model(): string | undefined {
    return this.getAttribute('model')
  }

  public get fwVer(): string | undefined {
    return this.getAttribute('fw_ver')
  }

  public readonly protocol: MiIO
  public readonly service: Service

  constructor(info: DeviceInfo) {
    const { host = '0.0.0.0', port = 54321, serviceTokens, ...props } = info
    super(host, port, props, { type: 'udp4' })
    if (this.stamp) {
      this.setAttribute('timestamp', Date.now())
    }
    this.protocol = new MiIO(this.did, this.token)
    this.service = new Service({ serviceTokens })
  }

  public setToken(token: string) {
    this.setAttribute('token', token)
    this.protocol.setToken(token)
  }

  public call(method: string, params: any = [], options?: { deconnect: boolean }): Promise<any> {
    const id = this.generateId()
    return this.request(String(id), JSON.stringify({ id, method, params }), options)
      .then(val => val.result)
  }

  public send(data: string) {
    const packet = this.protocol.encode(
      data,
      this.stamp && this.timestamp
        ? this.stamp + Math.floor((Date.now() - this.timestamp) / 1000)
        : undefined,
    )
    if (!packet) {
      return Promise.reject(new Error('Token is required to call method'))
    }
    return super.send(packet)
  }

  protected onMessage(packet: Buffer) {
    const data = this.protocol.decode(packet)
    if (!data || !data.encrypted.length) return
    if (data.stamp > 0) {
      this.setAttribute('stamp', data.stamp)
      this.setAttribute('timestamp', Date.now())
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

  public miIoInfo() {
    return this.call('miIO.info').then(res => {
      for (const [key, val] of Object.entries(res)) {
        this.setAttribute(key, val)
      }
      return res
    })
  }

  protected resovleIid(iid: string) {
    const [siid, piid] = iid
      .replace(/^0\./, '')
      .split('.')
    return { siid: Number(siid), piid: Number(piid) }
  }

  public getProps(iids: string[]) {
    if (this.token) {
      return this.call('get_properties', iids.map(iid => {
        const { siid, piid } = this.resovleIid(iid)
        return { did: String(this.did), siid, piid }
      }))
    } else {
      return this.service.miot.getProps(this.did, iids)
    }
  }

  public async getProp(iid: string) {
    return this.getProps([iid]).then(res => res[0])
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

  public async setProp(iid: string, value: any) {
    return this.setProps([[iid, value]]).then(res => res[0])
  }

  public action(iid: string, args: any[]) {
    if (this.token) {
      const { siid, piid } = this.resovleIid(iid)
      return this.call('action', {
        did: String(this.did), siid, aiid: piid, in: args,
      })
    } else {
      return this.service.miot.action(this.did, iid, args)
    }
  }
}
