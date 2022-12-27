import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { createInterface } from 'node:readline'
import { cac } from 'cac'
import { Cloud, Discovery } from '@homeiot/xiaomi'
import consola from 'consola'
import { version } from '../package.json'
import { getPasswordByTerminalInput, lookupFile, normalizePath } from './utils'
import { cache } from './cache'
import { cloudDeviceFormat, localDeviceFormat, specFormat } from './formats'
import type { Device } from '@homeiot/xiaomi'

const { FancyReporter } = consola as any

consola.setReporters([
  new FancyReporter({
    formatOptions: { colors: true, depth: 10 },
  }),
])

export async function createCli(
  config: {
    [key: string]: any
    cwd: string
    cacheDir?: string
  },
  input = process.stdin,
  output = process.stdout,
) {
  const { cwd, cacheDir: cacheDirOption, ...options } = config
  const pkgPath = lookupFile(cwd, ['package.json'], { pathOnly: true })
  const cacheDir = normalizePath(
    cacheDirOption
      ? path.resolve(cwd, cacheDirOption)
      : pkgPath
        ? path.join(path.dirname(pkgPath), 'node_modules/.miot')
        : path.join(cwd, '.miot'),
  )
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true })
  }
  const cachePath = path.join(cacheDir, 'access_tokens.json')

  const cloud = new Cloud({
    ...options,
    accessTokens: JSON.parse((await cache(cachePath)) || '{}'),
    log: consola,
  })

  const cli = cac('miot')

  cli.on('end', () => {
    cache(cachePath, JSON.stringify(cloud.config.accessTokens))
  })

  cli
    .command('discover', 'Start local area network discover')
    .action(() => {
      new Discovery()
        .on('start', () => consola.start(`discovering devices. press ctrl+c to stop.${ os.EOL }`))
        .on('device', (device: Device) => {
          consola.log(localDeviceFormat(device))
        })
        .start()
    })

  cli
    .command('login', 'Login account for Xiaomi')
    .action(async () => {
      const readline = createInterface({ input, output })
      cloud.config.username = await new Promise(resolve => {
        readline.question('Username:', username => {
          readline.close()
          resolve(String(username))
        })
      })
      cloud.config.password = await getPasswordByTerminalInput(input, output)
      await cloud.account.login('xiaomiio')
      consola.success('ok')
    })

  cli
    .command('[did] [iid] [...args]', 'MIoT/miIO LAN/WAN control')
    .option('-l, --lan', 'Use LAN control')
    .option('-a, --action', 'Execute an action')
    .option('-r, --raw', 'Output raw content, not formatted content')
    .example('miot')
    .example('miot devices')
    .example('miot zhimi.airpurifier.ma2')
    .example('miot 570xxxxxx')
    .example('miot 570xxxxxx 2.1')
    .example('miot 570xxxxxx 2.1 40')
    .example('miot 570xxxxxx 5.3 PlayText -a')
    .action(async (
      did: string | undefined,
      iid: string | undefined,
      args: string[],
      options: Record<string, any>,
    ) => {
      const { raw: isOutputRaw, action: isAction } = options

      if (!did || did === 'devices') {
        const devices = await cloud.miio.getDevices()
        consola.log(isOutputRaw ? devices : devices.map(cloudDeviceFormat).join(os.EOL + os.EOL))
      } else if (!iid) {
        if (isNaN(Number(did))) {
          const spec = await cloud.miotSpec.find(did)
          consola.log(isOutputRaw ? spec : specFormat(spec))
        } else {
          const device = await cloud.miio.getDevice(did)
          const spec = await cloud.miotSpec.find(device.model)
          const specUrl = `https://home.miot-spec.com/spec/${ device.model }`
          if (isOutputRaw) {
            consola.log({ device, spec, specUrl })
          } else {
            consola.info(`Device basic information${ os.EOL }`)
            consola.log(cloudDeviceFormat(device) + os.EOL)
            consola.info(`Device specification${ os.EOL }`)
            consola.log(specFormat(spec) + os.EOL)
            consola.info(`Device specification url ${ specUrl }`)
          }
        }
      } else {
        if (isAction) {
          const res = await cloud.miot.action(did, iid, args)
          if (isOutputRaw) {
            consola.log(res)
          } else {
            consola.success('ok')
          }
        } else {
          let value = args[0] as any
          if (!isNaN(Number(value))) value = Number(value)
          if (value === 'true') value = true
          if (value === 'false') value = false
          if (iid.includes('.')) {
            if (args.length) {
              const res = await cloud.miot.setProp(did, iid, value)
              if (isOutputRaw) {
                consola.log(res)
              } else {
                consola.success('ok')
              }
            } else {
              const prop = await cloud.miot.getProp(did, iid)
              if (isOutputRaw) {
                consola.log(prop)
              } else {
                consola.success(prop.value)
              }
            }
          } else {
            if (args.length) {
              const res = await cloud.miio.setProp(did, iid, value)
              if (isOutputRaw) {
                consola.log(res)
              } else {
                consola.success('ok')
              }
            } else {
              const prop = await cloud.miio.getProp(did, iid)
              if (isOutputRaw) {
                consola.log(prop)
              } else {
                consola.success(prop)
              }
            }
          }
        }
      }
    })

  cli
    .help()
    .version(version)
    .parse(process.argv, { run: false })

  return cli
}
