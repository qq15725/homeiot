import { Discovery as BaseDiscovery } from '@homeiot/shared'
import { EOL } from './constants'
import { Device } from './device'
import { toCameCase } from './utils'
import type { DiscoveredDeviceInfo } from './types'

// export type DiscoveryEvents = {
//   didDiscoverDevice: (device: Device) => void
// }

export class Discovery extends BaseDiscovery {
  constructor() {
    super(
      '239.255.255.250',
      1982,
      'M-SEARCH * HTTP/1.1\r\nMAN: "ssdp:discover"\r\nST: wifi_bulb\r\n',
      { type: 'udp4', reuseAddr: true },
    )

    this.on('message', this.onMessage.bind(this))
  }

  protected onMessage(data: Buffer) {
    const message = data.toString()

    if (message.startsWith('M-SEARCH')) return

    const info = message.split(EOL).reduce((props, line) => {
      if (!line.includes(': ')) return props
      const [header, headerValue] = line.split(': ')
      const key = toCameCase(header.toLowerCase())
      const value = headerValue.trim()
      switch (key) {
        case 'bright':
        case 'colorMode':
        case 'ct':
        case 'hue':
        case 'sat':
        case 'rgb':
          props[key] = Number(value)
          break
        case 'support':
          props[key] = value.split(' ') as any
          break
        default:
          props[key] = value
          break
      }
      return props
    }, {} as Record<string, any>)

    const device = new Device(info as DiscoveredDeviceInfo)

    this.emit('didDiscoverDevice', device)
  }
}
