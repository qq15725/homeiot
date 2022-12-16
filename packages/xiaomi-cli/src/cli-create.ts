import { cac } from 'cac'
import { Api, Discovery } from '@homeiot/xiaomi'
import consola from 'consola'
import { version } from '../package.json'
import { getPasswordByTerminalInput } from './password'

export function createCli(
  input = process.stdin,
  output = process.stdout,
) {
  const cli = cac('miot')

  cli
    .command('devices', 'List all devices from xiaomi cloud')
    .option('-u, --username <username>', 'Xiaomi user name')
    .option('-p, --password [password]', 'Password')
    .action(async options => {
      if (typeof options.password === 'boolean' || !options.password) {
        options.password = await getPasswordByTerminalInput(input, output)
      }
      const devices = await new Api(options).getDevices()
      output.write(JSON.stringify(devices, null, 2))
    })

  cli
    .command('discover', 'List all devices from local discover')
    .action(() => {
      const discovery = new Discovery()
        .on('started', () => {
          consola.start('looking for local devices...')
          setInterval(() => discovery.discover(), 5000)
        })
        .on('missingToken', (info, remote) => consola.log(info, remote))
        .on('discovered', device => consola.log(device))
      discovery.start()
    })

  cli
    .help()
    .version(version)
    .parse(process.argv, { run: false })

  return cli
}
