import { BaseDevice } from '@homeiot/shared'
import { MiIO } from './MiIO'
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

  public readonly miIO: MiIO

  constructor(info: DeviceInfo) {
    const { host, port = 54321, ...props } = info
    super(host, port, props, { type: 'udp4' })
    if (this.stamp) {
      this.setAttribute('timestamp', Date.now())
    }
    this.miIO = new MiIO(this.did, this.token)
  }

  public setToken(token: string) {
    this.setAttribute('token', token)
    this.miIO.setToken(token)
  }

  public call(method: string, params: any = [], options?: { deconnect: boolean }): Promise<any> {
    const id = this.generateId()
    return this.request(String(id), JSON.stringify({ id, method, params }), options)
      .then(val => val.result)
  }

  public send(data: string) {
    const packet = this.miIO.encode(
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
    const data = this.miIO.decode(packet)
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

  // miio local protocal

  public miIoInfo() {
    return this.call('miIO.info').then(res => {
      for (const [key, val] of Object.entries(res)) {
        this.setAttribute(key, val)
      }
      return res
    })
  }

  // miot local protocal

  public getProperties(params: { siid: number; piid: number }[]) {
    return this.call('get_properties', params.map(param => ({ ...param, did: Number(this.id) })))
  }

  public setProperties(params: { siid: number; piid: number; value: any }[]) {
    return this.call('set_properties', params.map(param => ({ ...param, did: Number(this.id) })))
  }

  public action(param: { siid: number; aiid: number; in: any[] }) {
    return this.call('action', { ...param, did: Number(this.id) })
  }
}
