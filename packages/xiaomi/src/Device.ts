import { BaseDevice } from '@homeiot/shared'
import { decodePacket, encodePacket } from './miio'
import type { DeviceInfo } from './types'

export class Device extends BaseDevice {
  // Device ID ("did")
  public get id(): number {
    return this.getAttribute('id')
  }

  public get token(): string | undefined {
    return this.getAttribute('token')
  }

  public set token(value) {
    this.setAttribute('token', value)
  }

  public get serverStamp(): number | undefined {
    return this.getAttribute('serverStamp')
  }

  public get serverStampTime(): number | undefined {
    return this.getAttribute('serverStampTime')
  }

  constructor(info: DeviceInfo) {
    const { host, port = 54321, ...props } = info
    super(host, port, { type: 'udp4' })
    this.setAttributes(props)
  }

  public call(method: string, params: any = [], options?: { deconnect: boolean }): Promise<any> {
    try {
      const id = this.generateId()
      return this.request(String(id), JSON.stringify({ id, method, params }), options)
    } catch (err) {
      return Promise.reject(err)
    }
  }

  public send(data: string) {
    if (!this.token) {
      return Promise.reject(new Error('Token is required to call method'))
    }
    return super.send(
      encodePacket(
        data,
        this.id,
        this.token,
        this.serverStamp && this.serverStampTime
          ? this.serverStamp + Math.floor((Date.now() - this.serverStampTime) / 1000)
          : undefined,
      ),
    )
  }

  protected onMessage(packet: Buffer) {
    if (!this.token) return

    const data = decodePacket(packet, this.token)

    if (!data.encrypted.length) return

    if (data.stamp > 0) {
      this.setAttribute('serverStamp', data.stamp)
      this.setAttribute('serverStampTime', Date.now())
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
    return this.call('miIO.info')
  }

  // miot local protocal

  public getProperties(params: { siid: number; piid: number }[]) {
    return this.call('get_properties', params.map(param => ({ ...param, did: this.id })))
  }

  public setProperties(params: { siid: number; piid: number; value: any }[]) {
    return this.call('set_properties', params.map(param => ({ ...param, did: this.id })))
  }

  public action(param: { siid: number; aiid: number; in: any[] }) {
    return this.call('action', { ...param, did: this.id })
  }
}
