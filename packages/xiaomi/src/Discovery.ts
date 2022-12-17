import { BaseDiscovery } from '@homeiot/shared'
import { Device } from './Device'
import type { BaseDiscoveryEvents } from '@homeiot/shared'
import type { RemoteInfo } from 'node:dgram'

export type DiscoveryEvents = BaseDiscoveryEvents & {
  missingToken: (info: Record<string, any>, remote: RemoteInfo) => void
  didDiscoverDevice: (device: Device) => void
}

export class Discovery extends BaseDiscovery {
  constructor(
    protected readonly didTokens: Record<number, string> = {},
  ) {
    super(
      '255.255.255.255', 54321,
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
      Buffer.from(
        '2131' + '0020'
        + 'ffffffff'
        + 'ffffffff'
        + 'ffffffff'
        + 'ffffffffffffffffffffffffffffffff',
        'hex',
      ),
    )
  }

  protected onMessage(message: Buffer, remote: RemoteInfo) {
    const { address: host, port } = remote
    const deviceId = message.readUInt32BE(8)
    const stamp = message.readUInt32BE(12)
    const checksum = message.subarray(16, 32).toString('hex')
    const encrypted = message.subarray(32)

    if (!stamp || encrypted.length > 0) return

    const token = checksum.match(/^[fF0]+$/)
      ? this.didTokens[deviceId]
      : checksum

    const info = {
      host,
      port,
      did: deviceId,
      serverStamp: Number(stamp.toString()),
      serverStampTime: Date.now(),
    }

    if (!token) {
      this.emit('missingToken', info, remote)
      return
    }

    this.emit('didDiscoverDevice', new Device({ ...info, token }))
  }
}
