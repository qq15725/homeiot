import { Discovery as BaseDiscovery } from '@homeiot/shared'

export type DiscoveryEvents = {
  started: () => void
  error: (error: Error) => void
  discovered: (device: Record<string, any>) => void
}

export class Discovery extends BaseDiscovery {
  constructor() {
    super(
      '224.0.0.50', 4321,
      '{"cmd": "whois"}',
      { serverPort: 9898 },
    )
  }

  // { "cmd": "iam", "ip": "192.168.0.42", "port": "9898", "model": "gateway", ..... }
  protected isIamMessage(message: Record<string, any>): message is {
    [key: string]: any
    cmd: 'iam'
    ip: string
    port: number
  } {
    return 'cmd' in message
      && message.cmd === 'iam'
      && 'ip' in message
      && 'port' in message
  }

  protected onMessage(buffer: Buffer) {
    let message: Record<string, any>
    try {
      message = JSON.parse(buffer.toString())
      if (!message) return
    } catch (err: any) {
      return
    }

    if (this.isIamMessage(message)) {
      this.emit('discovered', message)
    }
  }
}
