import { BaseDiscovery } from '@homeiot/shared'
import { EOL } from './utils'
import { Device } from './device'
import type { BaseDiscoveryEvents } from '@homeiot/shared'

export type DiscoveryEvents = BaseDiscoveryEvents & {
  device: (device: Device) => void
}

export class Discovery extends BaseDiscovery {
  constructor() {
    super(
      '239.255.255.250', 1982,
      [
        'M-SEARCH * HTTP/1.1',
        'MAN: "ssdp:discover"',
        'ST: wifi_bulb',
      ].join(EOL),
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
          const key = array[0]
          const value = array.slice(1).join(':').trim()
          switch (key) {
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
        { from } as Record<string, any>,
      )

    if (!info.location?.startsWith('yeelight://')) return

    const [host, port] = info.location.split('//')[1].split(':')

    this.emit('device', new Device({
      ...info,
      host,
      port: Number(port),
    }))
  }
}
