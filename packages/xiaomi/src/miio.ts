import { createCipheriv, createDecipheriv, createHash } from 'node:crypto'

const cache = new Map<string, { key: string; iv: string }>()

function getKeyAndIv(token: string) {
  if (cache.has(token)) return cache.get(token)!
  const key = createHash('md5').update(token, 'hex').digest().toString()
  const iv = createHash('md5').update(key).update(token, 'hex').digest().toString()
  const res = { key, iv }
  cache.set(token, res)
  return res
}

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
export function createHelloPacket() {
  return Buffer.from(
    '2131' + '0020'
    + 'ffffffff'
    + 'ffffffff'
    + 'ffffffff'
    + 'ffffffffffffffffffffffffffffffff',
    'hex',
  )
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
 *
 * encrypted:
 * Key = MD5(Token)
 * IV  = MD5(MD5(Key) + Token)
 */
export function encodePacket(
  data: string,
  deviceId: number,
  token: string,
  stamp?: number,
): Buffer {
  const { key, iv } = getKeyAndIv(token)

  const header = Buffer.alloc(2 + 2 + 4 + 4 + 4 + 16)
  header.writeInt16BE(0x2131)

  // Encrypt the data
  const cipher = createCipheriv('aes-128-cbc', key, iv)
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(data, 'utf8')),
    cipher.final(),
  ])

  // Set the length
  header.writeUInt16BE(32 + encrypted.length, 2)

  // Unknown
  header.writeUInt32BE(0x00000000, 4)

  // Stamp
  if (stamp) {
    header.writeUInt32BE(stamp, 12)
  } else {
    header.writeUInt32BE(0xFFFFFFFF, 12)
  }

  // Device ID
  header.writeUInt32BE(deviceId, 8)

  // MD5 Checksum
  const digest = createHash('md5')
    .update(header.subarray(0, 16))
    .update(token, 'hex')
    .update(encrypted)
    .digest()

  digest.copy(header, 16)

  return Buffer.concat([header, encrypted])
}

interface DecodedData {
  deviceId: number
  stamp: number
  checksum: Buffer
  encrypted: Buffer
  decrypted?: string
}

export function decodePacket(packet: Buffer, token?: string): DecodedData {
  const data: DecodedData = {
    deviceId: packet.readUInt32BE(8),
    stamp: packet.readUInt32BE(12),
    checksum: packet.subarray(16, 32),
    encrypted: packet.subarray(32),
  }

  // Hello packet
  if (data.encrypted.length === 0 || !token) return data

  const digest = createHash('md5')
    .update(packet.subarray(0, 16))
    .update(token)
    .update(data.encrypted)
    .digest()

  // Invalid packet
  if (!data.checksum.equals(digest)) return data

  const { key, iv } = getKeyAndIv(token)

  const decipher = createDecipheriv('aes-128-cbc', key, iv)
  data.decrypted = Buffer
    .concat([
      decipher.update(data.encrypted),
      decipher.final(),
    ])
    .toString()

  return data
}
