import { Discovery as BaseDiscovery } from '@homeiot/shared'
import { Device } from './Device'
import type { DeviceInfo } from './Device'

export type DiscoveryEvents = {
  started: () => void
  error: (error: Error) => void
  discovered: (device: Device) => void
}

export class Discovery extends BaseDiscovery {
  constructor() {
    super(
      '224.0.0.50', 4321,
      '{"cmd": "whois"}',
      { serverPort: 9898 },
    )
  }

  protected onMessage(buffer: Buffer) {
    let message: Record<string, any>

    try {
      message = JSON.parse(buffer.toString())
    } catch (err: any) {
      this.emit('error', err)
      return
    }

    if (!('cmd' in message)) return

    const { cmd, ...props } = message

    switch (cmd) {
      case 'iam':
        this.emit('discovered', new Device({ ...props } as DeviceInfo))
        break
    }
  }
}