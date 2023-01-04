import path from 'node:path'
import os from 'node:os'
import { createInterface } from 'node:readline'
import { cac } from 'cac'
import { Device, Discovery, Service } from '@homeiot/xiaomi'
import consola from 'consola'
import { version } from '../package.json'
import { getPasswordByTerminalInput, lookupFile, normalizePath } from './utils'
import { cache } from './cache'
import { cloudDeviceFormat, discoveredDeviceFormat, lanDeviceFormat, specFormat } from './formats'

const { FancyReporter } = consola as any

consola.setReporters([
  new FancyReporter({
    formatOptions: { colors: true, depth: 10 },
  }),
])

export function createCli(
  config: {
    [key: string]: any
    cwd: string
    cacheDir?: string
  },
  input = process.stdin,
  output = process.stdout,
) {
  const { cwd, cacheDir: cacheDirOption, ...options } = config

  // cache
  const pkgPath = lookupFile(cwd, ['package.json'], { pathOnly: true })
  const cacheDir = normalizePath(
    cacheDirOption
      ? path.resolve(cwd, cacheDirOption)
      : pkgPath
        ? path.join(path.dirname(pkgPath), 'node_modules/.miot')
        : path.join(cwd, '.miot'),
  )
  const serviceTokensCachePath = path.join(cacheDir, 'service_tokens.json')
  const devicesCachePath = path.join(cacheDir, 'devices.json')
  const getDevices = (): Record<string, any>[] => cache(devicesCachePath) ?? []
  const setDevices = (devices: Record<string, any>[]) => cache(devicesCachePath, devices)
  const getServiceTokens = () => cache(serviceTokensCachePath) ?? {}
  const setServiceTokens = (serviceTokens: Record<string, any>) => cache(serviceTokensCachePath, serviceTokens)

  const service = new Service({
    ...options,
    serviceTokens: getServiceTokens(),
    log: consola,
  })
    .on('serviceToken', () => setServiceTokens(service.config.serviceTokens))

  const cli = cac('miot')

  cli
    .command('discover', 'Start local area network discover')
    .action(() => {
      new Discovery()
        .on('start', () => consola.start(`discovering devices. press ctrl+c to stop.${ os.EOL }`))
        .on('device', (device: Device) => {
          consola.log(discoveredDeviceFormat(device) + os.EOL)
        })
        .start()
    })

  cli
    .command('login', 'Login account for Xiaomi')
    .action(async () => {
      const readline = createInterface({ input, output })
      service.config.username = await new Promise(resolve => {
        readline.question('Username:', username => {
          readline.close()
          resolve(String(username))
        })
      })
      service.config.password = await getPasswordByTerminalInput(input, output)
      await service.account.login(service.miot.sid)
      const devices = await service.miio.getDevices()
      setDevices(devices)
      consola.log(devices.map(cloudDeviceFormat).join(os.EOL + os.EOL))
    })

  cli
    .command('[did] [iid] [...args]', 'MIoT/miIO LAN/WAN control')
    .option('-l, --lan', 'Use LAN control')
    .option('-a, --action', 'Execute an action')
    .option('-r, --raw', 'Output raw content, not formatted content')
    .example('miot')
    .example('miot devices')
    .example('miot zhimi.airpurifier.ma2')
    .example('miot 570580000')
    .example('miot 570580000 2.1')
    .example('miot 570580000 2.1 40')
    .example('miot 570580000 5.3 PlayText -a')
    .action(async (
      did: string | undefined,
      iid: string | undefined,
      args: string[],
      options: Record<string, any>,
    ) => {
      const { raw: isOutputRaw, action: isAction, lan: useLAN } = options

      if (!did || did === 'devices') {
        const devices = await service.miio.getDevices()
        setDevices(devices)
        consola.log(isOutputRaw ? devices : devices.map(cloudDeviceFormat).join(os.EOL + os.EOL))
        return
      }

      if (isNaN(Number(did))) {
        const spec = await service.miotSpec.find(did)
        consola.log(isOutputRaw ? spec : specFormat(spec))
        return
      }

      const info = getDevices().find(v => Number(v.did) === Number(did))
      const device = new Device({
        did: Number(did),
        host: info?.localip,
        token: useLAN ? info?.token : undefined,
        serviceTokens: useLAN ? undefined : getServiceTokens(),
      })
      if (!iid) {
        const info = await device.getInfo()
        const spec = useLAN ? undefined : await device.getSpec()
        const specUrl = `https://home.miot-spec.com/spec/${ info.model }`
        if (isOutputRaw) {
          consola.log({ info, spec, specUrl })
        } else {
          if (useLAN) {
            consola.log(lanDeviceFormat(info))
          } else {
            consola.info(`Device basic information${ os.EOL }`)
            consola.log(cloudDeviceFormat(info) + os.EOL)
            consola.info(`Device specification${ os.EOL }`)
            consola.log(specFormat(spec!) + os.EOL)
            consola.info(`Device specification url ${ specUrl }`)
          }
        }
      } else {
        if (isAction) {
          const res = await device.action(iid, args)
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
          if (args.length) {
            const res = await device.setProp(iid, value)
            if (isOutputRaw) {
              consola.log(res)
            } else {
              consola.success('ok')
            }
          } else {
            const prop = await device.getProp(iid)
            if (isOutputRaw) {
              consola.log(prop)
            } else {
              consola.success(prop.value ? prop.value : prop)
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
