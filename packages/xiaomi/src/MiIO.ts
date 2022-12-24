import { createCipheriv, createDecipheriv, createHash } from 'node:crypto'
import type { DecodedPacket } from './types'

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
 *
 * encrypted:
 * Key = MD5(Token)
 * IV  = MD5(Key + Token)
 */
export class MiIO {
  /**
   *   0                   1                   2                   3
   *   0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
   *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
   *  | 0x2131                        | 0x0020                        |
   *  |-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-|
   *  | 0xffffffff                                                    |
   *  |-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-|
   *  | 0xffffffff                                                    |
   *  |-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-|
   *  | 0xffffffff                                                    |
   *  |-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-|
   *  | 0xffffffffffffffffffffffffffffffff                            |
   *  |                                                               |
   *  |-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-|
   */
  public static helloPacket = Buffer.from(
    '2131' + '0020'
    + 'ffffffff'
    + 'ffffffff'
    + 'ffffffff'
    + 'ffffffffffffffffffffffffffffffff',
    'hex',
  )

  public tokenKey?: Buffer
  public tokenIv?: Buffer

  constructor(
    public did?: number,
    public token?: string,
  ) {
    token && this.setToken(token)
  }

  public setToken(token: string) {
    this.token = token
    this.tokenKey = createHash('md5').update(this.token, 'hex').digest()
    this.tokenIv = createHash('md5').update(this.tokenKey).update(this.token, 'hex').digest()
  }

  public encode(data: string, stamp?: number): Buffer | undefined {
    // Missing token
    if (!this.token || !this.did || !this.tokenKey || !this.tokenIv) {
      return undefined
    }
    const header = Buffer.alloc(2 + 2 + 4 + 4 + 4 + 16)
    header.writeInt16BE(0x2131)
    // Encrypt the data
    const cipher = createCipheriv('aes-128-cbc', this.tokenKey, this.tokenIv)
    const encrypted = Buffer.concat([
      cipher.update(Buffer.from(data, 'utf8')),
      cipher.final(),
    ])
    // Set the length
    header.writeUInt16BE(32 + encrypted.length, 2)
    // Unknown
    header.writeUInt32BE(0x00000000, 4)
    // Stamp
    header.writeUInt32BE(stamp ?? 0xFFFFFFFF, 12)
    // Device ID
    header.writeUInt32BE(this.did, 8)
    // MD5 Checksum
    const digest = createHash('md5')
      .update(header.subarray(0, 16))
      .update(this.token, 'hex')
      .update(encrypted)
      .digest()
    digest.copy(header, 16)
    return Buffer.concat([header, encrypted])
  }

  public decode(packet: Buffer): DecodedPacket | undefined {
    const data: DecodedPacket = {
      did: packet.readUInt32BE(8),
      stamp: packet.readUInt32BE(12),
      checksum: packet.subarray(16, 32),
      encrypted: packet.subarray(32),
    }
    // Hello packet
    if (data.encrypted.length === 0) {
      return data
    }
    // Missing token
    if (!this.token || !this.tokenKey || !this.tokenIv) {
      return undefined
    }
    const digest = createHash('md5')
      .update(packet.subarray(0, 16))
      .update(this.token, 'hex')
      .update(data.encrypted)
      .digest()
    // Invalid packet
    if (!data.checksum.equals(digest)) {
      return undefined
    }
    const decipher = createDecipheriv('aes-128-cbc', this.tokenKey, this.tokenIv)
    data.decrypted = Buffer
      .concat([
        decipher.update(data.encrypted),
        decipher.final(),
      ])
      .toString()
    return data
  }
}
