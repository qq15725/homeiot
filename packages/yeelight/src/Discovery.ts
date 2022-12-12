import { Discovery as BaseDiscovery } from '@homeiot/shared'
import { EOL } from './constants'
import { Device } from './device'
import { toCameCase } from './utils'
import type { DeviceInfo } from './types'

export type DiscoveryEvents = {
  started: () => void
  error: (error: Error) => void
  discovered: (device: Device) => void
}

export class Discovery extends BaseDiscovery {
  constructor() {
    super(
      '239.255.255.250', 1982,
      'M-SEARCH * HTTP/1.1\r\nMAN: "ssdp:discover"\r\nST: wifi_bulb\r\n',
      { serverPort: 1982 },
    )
  }

  protected onMessage(message: Buffer) {
    const [firstLine, ...lines] = message.toString().split(EOL)

    if (
      !firstLine.includes('HTTP/1.1')
      || firstLine === 'M-SEARCH * HTTP/1.1'
    ) return

    const from = firstLine === 'NOTIFY * HTTP/1.1'
      ? 'notify'
      : firstLine === 'HTTP/1.1 200 OK'
        ? 'response'
        : firstLine

    const info = lines
      .reduce(
        (props, line) => {
          const array = line.split(':')
          if (array.length === 1) return props
          const keyRaw = array[0]
          const key = toCameCase(keyRaw.toLowerCase())
          const value = array.slice(1).join(':').trim()
          switch (keyRaw) {
            case 'Cache-Control':
            case 'Date':
            case 'Ext':
            case 'Host':
            case 'Server':
            case 'NTS': // ssdp:alive
              break
            case 'bright':
            case 'ct':
            case 'hue':
            case 'sat':
            case 'rgb':
              props[key] = Number(value)
              break
            case 'color_mode':
              props[key] = Number(value) as 1 | 2 | 3
              break
            case 'support':
              props[key] = value.split(' ')
              break
            default:
              props[key] = value
              break
          }
          return props
        },
        { from } as DeviceInfo,
      )

    if (!info.location.startsWith('yeelight://')) return

    this.emit('discovered', new Device(info))
  }
}
