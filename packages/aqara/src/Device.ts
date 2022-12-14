import { createCipheriv } from 'node:crypto'
import { BaseDevice } from '@homeiot/shared'

export interface DeviceInfo {
  ip: string
  port: number
  model: string
  sid: string
  shortId: number
}

export class Device extends BaseDevice {
  public static readonly iv = Buffer.from([0x17, 0x99, 0x6D, 0x09, 0x3D, 0x28, 0xDD, 0xB3, 0xBA, 0x69, 0x5A, 0x2E, 0x6F, 0x58, 0x56, 0x2E])
  public readonly model: string
  public readonly sid: string
  public readonly shortId: number
  public token = 'token'
  public password = 'password'

  constructor(info: DeviceInfo) {
    super(info.ip, info.port, {}, { type: 'udp4' })
    this.model = info.model
    this.sid = info.sid
    this.shortId = info.shortId
  }

  protected generateKey() {
    return createCipheriv('aes-128-cbc', this.password, Device.iv)
      .update(this.token, 'ascii', 'hex')
  }

  protected cmdUuid(cmd: string) {
    if (cmd.endsWith('_ack')) cmd = cmd.substring(-1, 4)
    return `${ cmd }${ this.sid }`
  }

  protected onMessage(buffer: Buffer) {
    let message: Record<string, any>
    try {
      message = JSON.parse(buffer.toString())
    } catch (err: any) {
      // error
      return
    }
    const { cmd, data } = message
    this.getWaitingRequest(this.cmdUuid(cmd))?.resolve(data)
  }

  public call(cmd: string, params?: Record<string, any>): Promise<any> {
    const payload: Record<string, any> = {
      cmd,
      model: this.model,
      sid: this.sid,
      short_id: this.shortId,
    }
    if (params) payload.data = JSON.stringify(params)
    return this.request(JSON.stringify(payload), { uuid: this.cmdUuid(cmd) })
  }

  public write = (props: Record<string, any>): Promise<Record<string, any>> => this.call('write', { ...props, key: this.generateKey() })
  public getIdList = (): Promise<string[]> => this.call('get_id_list')
  public read = (): Promise<Record<string, any>> => this.call('read')
}
