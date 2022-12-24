import { BaseDiscovery } from '@homeiot/shared'
import { Device } from './Device'
import { MiIO } from './MiIO'
import type { BaseDiscoveryEvents } from '@homeiot/shared'
import type { RemoteInfo } from 'node:dgram'

export type DiscoveryEvents = BaseDiscoveryEvents & {
  device: (device: Device) => void
}

export class Discovery extends BaseDiscovery {
  protected miIO = new MiIO()

  constructor() {
    super(
      '255.255.255.255', 54321,
      MiIO.helloPacket,
    )
  }

  protected onMessage(packet: Buffer, remote: RemoteInfo) {
    const { address: host } = remote
    const { did, checksum, stamp, encrypted } = this.miIO.decode(packet)!
    if (!stamp || encrypted.length > 0) return
    const token = checksum.toString('hex').match(/^[fF0]+$/)
      ? undefined
      : checksum.toString()
    this.emit('device', new Device({ did, stamp, host, token }))
  }
}
