import { createCipheriv, createDecipheriv, createHash } from 'node:crypto'
import { BaseDevice } from '@homeiot/shared'

export interface DeviceInfo {
  host: string
  port: number
  did: number
  token: string
  serverStamp: number
  serverStampTime: number
}

export class Device extends BaseDevice {
  public serverStamp: number
  public serverStampTime: number
  public readonly did: number
  public readonly token: string
  public readonly tokenKey: Buffer
  public readonly tokenIV: Buffer

  constructor(info: DeviceInfo) {
    super(info.host, info.port, { type: 'udp4' })
    this.did = info.did
    this.token = info.token
    this.tokenKey = createHash('md5').update(this.token).digest()
    this.tokenIV = createHash('md5').update(this.tokenKey).update(this.token).digest()
    this.serverStamp = info.serverStamp
    this.serverStampTime = info.serverStampTime
  }

  /**
   *  0                   1                   2                   3
   *  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
   * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
   * | Magic number = 0x2131         | Packet Length (incl. header)  |
   * |-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-|
   * | Unknown1                                                      |
   * |-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-|
   * | Device ID ("did")                                             |
   * |-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-|
   * | Stamp                                                         |
   * |-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-|
   * | MD5 checksum                                                  |
   * | ... or Device Token in response to the "Hello" packet         |
   * |-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-|
   * | optional variable-sized data (encrypted)                      |
   * |...............................................................|
   */
  protected encrypt(data: Buffer) {
    const header = Buffer.alloc(2 + 2 + 4 + 4 + 4 + 16)
    header.writeInt16BE(0x2131)

    // Encrypt the data
    const cipher = createCipheriv('aes-128-cbc', this.tokenKey, this.tokenIV)
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()])

    // Set the length
    header.writeUInt16BE(32 + encrypted.length, 2)

    // Unknown
    header.writeUInt32BE(0x00000000, 4)

    // Stamp
    if (this.serverStamp && this.serverStampTime) {
      const secondsPassed = Math.floor((Date.now() - this.serverStampTime) / 1000)
      header.writeUInt32BE(this.serverStamp + secondsPassed, 12)
    } else {
      header.writeUInt32BE(0xFFFFFFFF, 12)
    }

    // Device ID
    header.writeUInt32BE(this.did!, 8)

    // MD5 Checksum
    const digest
      = createHash('md5')
        .update(header.subarray(0, 16))
        .update(this.token)
        .update(encrypted)
        .digest()

    digest.copy(header, 16)

    return Buffer.concat([header, encrypted])
  }

  public invoke(method: string, params?: Record<string, any>): Promise<any> {
    return this.send(
      this.encrypt(
        Buffer.from(
          JSON.stringify({ id: 'uuid', method, params }),
          'utf8',
        ),
      ),
    )
  }

  protected onMessage(message: Buffer) {
    // const deviceId = message.readUInt32BE(8)
    const stamp = message.readUInt32BE(12)
    const checksum = message.subarray(16, 32)
    const encrypted = message.subarray(32)

    if (
      encrypted.length === 0
      || !checksum.equals(
        createHash('md5')
          .update(message.subarray(0, 16))
          .update(this.token)
          .update(encrypted)
          .digest(),
      )
    ) return

    if (stamp > 0) {
      this.serverStamp = stamp
      this.serverStampTime = Date.now()
    }

    const decipher = createDecipheriv('aes-128-cbc', this.tokenKey, this.tokenIV)
    const data = Buffer.concat([decipher.update(encrypted), decipher.final()])

    console.log(data)
  }
}
