import os from 'node:os'

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

export function specFormat(info: Record<string, any>) {
  return [
    info.description,
    info.services?.map(serviceFormat).join(os.EOL),
  ]
    .filter(Boolean)
    .join(os.EOL)
}

export function actionFormat(siid: number, info: Record<string, any>) {
  return [
    `${ color(`${ siid }.${ info.iid }`) } ${ info.description }`,
    info.in.join(' ') || '_',
    info.out.join(' ') || '_',
  ].join(', ')
}

export function propertyFormat(siid: number, info: Record<string, any>) {
  return [
    `${ color(`${ siid }.${ info.iid }`) } ${ info.description }`,
    info.format,
    info.access.join(' ') || '_',
  ].join(', ')
}

export function serviceFormat(info: Record<string, any>) {
  return [
    `  ${ info.iid } ${ info.description }`,
    info.properties && color('    Properties', 'grey'),
    info.properties?.map((v: any) => `      ${ propertyFormat(info.iid, v) }`).join(os.EOL),
    info.actions && color('    Actions', 'grey'),
    info.actions?.map((v: any) => `      ${ actionFormat(info.iid, v) }`).join(os.EOL),
  ]
    .filter(Boolean)
    .join(os.EOL)
}

export function localDeviceFormat(info: Record<string, any>) {
  return `
   ip: ${ info.host }
  did: ${ info.did }
token: ${ info.token ?? 'Unknown' }`
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
