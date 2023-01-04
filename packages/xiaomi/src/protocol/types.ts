export interface DecodedPacket {
  did: number
  stamp: number
  checksum: Buffer
  encrypted: Buffer
  decrypted?: string
}
