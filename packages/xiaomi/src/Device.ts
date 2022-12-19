import { BaseDevice } from '@homeiot/shared'
import { decodePacket, encodePacket } from './miio'
import type { DeviceInfo } from './types'

export class Device extends BaseDevice {
  private static requestAutoIncrementId = 0

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

  public get power(): 'on' | 'off' | undefined {
    return this.getAttribute('power')
  }

  public set power(value) {
    if (value === undefined) {
      this.setAttribute('power', value)
    } else if (this.power !== value) {
      this.call('set_power', [value])
        .then(() => this.setAttribute('power', value))
        .catch(err => this.emit('error', err))
    }
  }

  constructor(info: DeviceInfo) {
    const { host, port, ...props } = info
    super(host, port, { type: 'udp4' })
    this.setAttributes(props)
  }

  public call(method: string, params: any = []): Promise<any> {
    if (!this.token) {
      return Promise.reject(new Error('Token is required to call method'))
    }

    try {
      const id = ++Device.requestAutoIncrementId
      return this.request(
        String(id),
        encodePacket(
          JSON.stringify({ id, method, params }),
          this.id,
          this.token,
          this.serverStamp && this.serverStampTime
            ? this.serverStamp + Math.floor((Date.now() - this.serverStampTime) / 1000)
            : undefined,
        ),
      )
    } catch (err) {
      return Promise.reject(err)
    }
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

    if (
      'id' in message
      && 'result' in message
    ) {
      this.pullWaitingRequest(String(message.id))?.resolve(message)
    } else if (
      'id' in message
      && 'error' in message
      && 'code' in message.error
      && 'message' in message.error
    ) {
      this.pullWaitingRequest(String(message.id))?.reject(message.error.message)
    }
  }

  // miio

  public miIoInfo() {
    return this.call('miIO.info')
  }

  public getProperties(params: any[]) {
    return this.call('get_properties', params)
  }

  public setProperties(params: any[]) {
    return this.call('set_properties', params)
  }

  public action(param: any) {
    return this.call('action', param)
  }

  // miot
}
