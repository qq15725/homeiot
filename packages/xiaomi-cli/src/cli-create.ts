import { cac } from 'cac'
import { Cloud, Discovery } from '@homeiot/xiaomi'
import consola, { FancyReporter } from 'consola'
import { version } from '../package.json'
import { getPasswordByTerminalInput } from './password'
import type { Device } from '@homeiot/xiaomi'

consola.setReporters([
  new FancyReporter({
    formatOptions: { colors: true, depth: 10 },
  }),
])

export function createCli(
  input = process.stdin,
  output = process.stdout,
) {
  const cli = cac('xiaomi')
  const cloud = new Cloud({
    log: consola,
  })

  cli
    .command('discover', 'List all devices from local discover')
    .action(() => {
      new Discovery()
        .on('start', () => consola.start('discovering devices. press ctrl+c to stop.'))
        .on('device', (device: Device) => {
          consola.success([
            `Device ID: ${ device.did }`,
            `Address: ${ device.host }`,
            `Token: ${ device.token ?? 'Unknown' }`,
          ].join('\r\n'))
        })
        .start()
    })

  cli
    .command('login <username>')
    .action(async (username) => {
      const password = await getPasswordByTerminalInput(input, output)
      consola.log(username, password)
    })

  cli
    .command('devices', 'List all devices from xiaomi cloud')
    .action(async () => {
      consola.success(await cloud.miio.getDevices())
    })

  cli
    .command('<did> [key] [value]', 'Call device set/get props from xiaomi cloud')
    .action(async (did, key, value) => {
      if (key === undefined) {
        if (isNaN(Number(did))) {
          return consola.success(await cloud.miotSpec.find(did))
        } else {
          return consola.success(await cloud.miio.getDevice(did))
        }
      }
      if (key === 'spec') {
        return consola.success(
          await cloud.miotSpec.find(
            (await cloud.miio.getDevice(did)).model,
          ),
        )
      }
      did = Number(did)
      if (value !== undefined) {
        if (!isNaN(Number(value))) value = Number(value)
        if (value === 'true') value = true
        if (value === 'false') value = false
      }
      const [key1, key2 = 1] = key.split('.')
      if (isNaN(Number(key1))) {
        if (value !== undefined) {
          consola.success(await cloud.miio.setProp(did, key, value))
        } else {
          consola.success(await cloud.miio.getProp(did, key))
        }
      } else {
        const siid = Number(key1)
        const piid = Number(key2)
        if (value !== undefined) {
          consola.success(await cloud.miot.setProp(did, [siid, piid], value))
        } else {
          consola.success(await cloud.miot.getProp(did, [siid, piid]))
        }
      }
    })

  cli
    .help()
    .version(version)
    .parse(process.argv, { run: false })

  return cli
}
