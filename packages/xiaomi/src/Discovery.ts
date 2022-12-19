import { BaseDiscovery } from '@homeiot/shared'
import { Device } from './Device'
import { createHelloPacket, decodePacket } from './miio'
import type { BaseDiscoveryEvents } from '@homeiot/shared'
import type { RemoteInfo } from 'node:dgram'

export type DiscoveryEvents = BaseDiscoveryEvents & {
  didDiscoverDevice: (device: Device) => void
}

export class Discovery extends BaseDiscovery {
  constructor() {
    super(
      '255.255.255.255', 54321,
      createHelloPacket(),
    )
  }

  protected onMessage(packet: Buffer, remote: RemoteInfo) {
    const { address: host, port } = remote
    const { deviceId, checksum, stamp, encrypted } = decodePacket(packet)

    if (!stamp || encrypted.length > 0) return

    this.emit('didDiscoverDevice', new Device({
      host,
      port,
      id: deviceId,
      token: checksum.toString('hex').match(/^[fF0]+$/)
        ? undefined
        : checksum.toString(),
      serverStamp: Number(stamp.toString()),
      serverStampTime: Date.now(),
    }))
  }
}
