import { BaseDiscovery } from '@homeiot/shared'
import { EOL, toCameCase } from './utils'
import { Device } from './device'
import type { BaseDiscoveryEvents } from '@homeiot/shared'
import type { RemoteInfo } from 'node:dgram'

export type DiscoveryEvents = BaseDiscoveryEvents & {
  didDiscoverDevice: (device: Device) => void
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
      { serverPort: 1982 },
    )
  }

  protected onMessage(message: Buffer, remote: RemoteInfo) {
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
        { from } as Record<string, any>,
      )

    if (!info.location?.startsWith('yeelight://')) return

    const [host, port] = info.location.split('//')[1].split(':')

    if (remote.address !== host || remote.port !== port) return

    this.emit(
      'didDiscoverDevice',
      new Device({
        ...info,
        host,
        port: Number(port),
      }),
    )
  }
}
