import os from 'node:os'
import type { MIoTSpecAction, MIoTSpecInstance, MIoTSpecProperty, MIoTSpecService } from '@homeiot/xiaomi'

const styles = {
  reset: '\x1B[0m',
  bright: '\x1B[1m',
  grey: '\x1B[2m',
  italic: '\x1B[3m',
  underline: '\x1B[4m',
  reverse: '\x1B[7m',
  hidden: '\x1B[8m',
  black: '\x1B[30m',
  red: '\x1B[31m',
  green: '\x1B[32m',
  yellow: '\x1B[33m',
  blue: '\x1B[34m',
  magenta: '\x1B[35m',
  cyan: '\x1B[36m',
  white: '\x1B[37m',
  blackBackground: '\x1B[40m',
  redBackground: '\x1B[41m',
  greenBackground: '\x1B[42m',
  yellowBackground: '\x1B[43m',
  blueBackground: '\x1B[44m',
  magentaBackground: '\x1B[45m',
  cyanBackground: '\x1B[46m',
  whiteBackground: '\x1B[47m',
}

function color(source: string, style: keyof typeof styles = 'bright') {
  return `${ styles[style] }${ source }${ styles.reset }`
}

function parseName(type: string) {
  return type.split(':')?.[3] ?? ''
}

function pad(length: number) {
  return String().padEnd(length, ' ')
}

export function specFormat(instance: MIoTSpecInstance) {
  const { type, services } = instance
  const name = parseName(type)
  return [
    name,
    ...services.map(serviceFormat)
      .join(os.EOL)
      .split(os.EOL)
      .map(str => `${ pad(2) }${ str }`),
  ]
    .join(os.EOL)
}

export function serviceFormat(service: MIoTSpecService) {
  const { iid, type, properties, actions } = service
  const siid = String(iid)
  const name = parseName(type)
  return [
    `${ siid } ${ name }`,
    [
      properties && [
        actions && color('Properties', 'grey'),
        ...properties.map(property => {
          const piid = property.iid
          const prefix = `${ siid }.${ piid } `
          return prefix
            + propertyFormat(property)
              .split(os.EOL)
              .map((str, index) => index ? `${ pad(prefix.length) }${ str }` : str)
              .join(os.EOL)
        }),
      ].filter(Boolean),

      actions && [
        color('Actions', 'grey'),
        ...actions.map(action => {
          const aiid = action.iid
          const prefix = `${ siid }.${ aiid } `
          return prefix
            + actionFormat(action)
              .split(os.EOL)
              .map((str, index) => index ? `${ pad(prefix.length) }${ str }` : str)
              .join(os.EOL)
        }),
      ],
    ]
      .filter(Boolean)
      .flat()
      .join(os.EOL)
      .split(os.EOL)
      .map(str => `${ pad(siid.length + 1) }${ str }`),
  ]
    .flat()
    .join(os.EOL)
}

export function propertyFormat(property: MIoTSpecProperty) {
  const { type, access, format, 'value-list': valueList, 'value-range': range } = property
  const name = parseName(type)
  const accesses = access.map(val => {
    if (val === 'read') {
      return color(val, 'green')
    } else if (val === 'write') {
      return color(val, 'cyan')
    } else {
      return color(val, 'grey')
    }
  }).join(color(',', 'grey'))
  const options = valueList
    ?.map(v => `${ v.value }: ${ v.description }`)
    .join(' ')
  return [
    `${ name } ${ color(format, 'grey') } ${ accesses }`,
    options && color(`options ${ options }`, 'grey'),
    range && color(`range ${ range[0] } ~ ${ range[1] } step size ${ range[2] }`, 'grey'),
  ]
    .filter(Boolean)
    .join(os.EOL)
}

export function actionFormat(action: MIoTSpecAction) {
  const { type } = action
  const name = parseName(type)
  return [
    name,
    color(`${ action.in.length }`, 'grey'),
    color(`${ action.out.length }`, 'grey'),
  ].join(' ')
}

export function discoveredDeviceFormat(info: Record<string, any>) {
  return `
   ip: ${ info.host }
  did: ${ info.did }
stamp: ${ info.stamp }
token: ${ info.token ?? 'Unknown' }`
    .replace(/^\n/, '')
}

export function lanDeviceFormat(info: Record<string, any>) {
  return `
          model: ${ info.model }
          token: ${ info.token }
           ssid: ${ info.ap?.ssid }
        localip: ${ info.netif?.localIp }
           life: ${ info.life }
       miio_ver: ${ info.miio_ver ?? '' }
         fw_ver: ${ info.fw_ver ?? '' }
    wifi_fw_ver: ${ info.wifi_fw_ver ?? '' }
miio_client_ver: ${ info.miio_client_ver ?? '' }`
    .replace(/^\n/, '')
}

export function cloudDeviceFormat(info: Record<string, any>) {
  return `
    did: ${ info.did }
   name: ${ info.name }
  model: ${ info.model }
  token: ${ info.token }
   ssid: ${ info.ssid }
localip: ${ info.localip }
   prop: ${ JSON.stringify(info.prop) }
 method: ${ JSON.stringify(info.method) }
 online: ${ info.isOnline ? color(info.isOnline, 'green') : color(info.isOnline, 'red') }`
    .replace(/^\n/, '')
    .replace(/.+: undefined\n/g, '')
}
