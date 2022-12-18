import { cac } from 'cac'
import { Discovery } from '@homeiot/yeelight'
import consola from 'consola'
import { version } from '../package.json'

export function createCli() {
  const cli = cac('yeelight')

  cli
    .command('discover', 'List all devices from local discover')
    .action(() => {
      new Discovery()
        .on('didFinishLaunching', () => consola.start('looking for local devices...'))
        .on('didDiscoverDevice', device => consola.log(device.toObject()))
        .start()
    })

  cli
    .help()
    .version(version)
    .parse(process.argv, { run: false })

  return cli
}
