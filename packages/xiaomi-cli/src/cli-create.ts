import { cac } from 'cac'
import { Cloud, Discovery, findInstance, parseInstanceProperties } from '@homeiot/xiaomi'
import consola from 'consola'
import { version } from '../package.json'
import { getPasswordByTerminalInput } from './password'
import type { Device } from '@homeiot/xiaomi'

export function createCli(
  input = process.stdin,
  output = process.stdout,
) {
  const cli = cac('xiaomi')

  cli
    .command('devices', 'List all devices from xiaomi cloud')
    .option('-u, --username <username>', 'Xiaomi user name')
    .option('-p, --password [password]', 'Password')
    .action(async options => {
      if (typeof options.password === 'boolean' || !options.password) {
        options.password = await getPasswordByTerminalInput(input, output)
      }
      const devices = await new Cloud(options).getDevices()
      output.write(JSON.stringify(devices, null, 2))
    })

  cli
    .command('call <method> [data]', 'Call device method')
    .option('--ip [ip]', 'ip')
    .option('--token [token]', 'token')
    .action((method, data, options) => {
      const discovery = new Discovery()
      discovery
        .on('didDiscoverDevice', (device: Device) => {
          if (device.host === options.ip) {
            discovery.stop()
            device.token = options.token
            device
              .on('request', (data: any) => consola.log('[request]', data))
              .on('response', (data: any) => consola.log('[response]', JSON.stringify(data)))
              .call(method, JSON.parse(data ?? '[]'), { deconnect: true })
          }
        })
        .start()
    })

  cli
    .command('discover', 'List all devices from local discover')
    .action(() => {
      new Discovery()
        .on('didFinishLaunching', () => consola.start('discovering devices. press ctrl+c to stop.'))
        .on('didDiscoverDevice', (device: Device) => {
          consola.log(`
Device ID: ${ device.id }
Address: ${ device.host }
Token: ${ device.token ?? 'Unknown' }`)
        })
        .start()
    })

  cli
    .command('instance <model>', 'Find miot instance')
    .action((model) => {
      findInstance(model)
        .then(v => consola.log(parseInstanceProperties(v)))
    })

  cli
    .help()
    .version(version)
    .parse(process.argv, { run: false })

  return cli
}
