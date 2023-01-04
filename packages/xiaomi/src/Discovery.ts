import { BaseDiscovery } from '@homeiot/shared'
import { Device } from './Device'
import { Protocol } from './protocol'
import type { BaseDiscoveryEvents } from '@homeiot/shared'
import type { RemoteInfo } from 'node:dgram'

export type DiscoveryEvents = BaseDiscoveryEvents & {
  device: (device: Device) => void
}

export class Discovery extends BaseDiscovery {
  protected protocol: Protocol

  constructor() {
    const protocol = new Protocol()
    super(
      '255.255.255.255', 54321,
      protocol.miio.helloPacket,
    )
    this.protocol = protocol
  }

  protected onMessage(packet: Buffer, remote: RemoteInfo) {
    const { address: host } = remote
    const { did, checksum, stamp, encrypted } = this.protocol.miio.decode(packet)!
    if (!stamp || encrypted.length > 0) return
    const token = checksum.toString('hex').match(/^[fF0]+$/)
      ? undefined
      : checksum.toString()
    this.emit('device', new Device({ did, stamp, host, token }))
  }
}
