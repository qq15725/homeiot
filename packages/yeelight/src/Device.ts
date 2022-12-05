import { DeviceTcp } from '@homeiot/shared'
import { EOL } from './constants'
import { getNextId, isErrorMessage, isPropsMessage, isResultMessage, toSnakeCase } from './utils'
import { getSpec } from './specs'
import type {
  DeviceMethodName,
  DeviceModelSpec,
  DevicePropName,
  DiscoveredDeviceInfo,
  Effect,
} from './types'

export class Device extends DeviceTcp {
  protected readonly commands = new Map<number, { timeout: any; resolve: any; reject: any }>()
  public readonly spec: DeviceModelSpec

  constructor(
    public readonly info: DiscoveredDeviceInfo,
  ) {
    const endpoint = info.location.split('//')[1]
    const [host, port] = endpoint.split(':')
    super(host, Number(port))
    this.spec = getSpec(info)
    this.on('message', this.onMessage.bind(this))
  }

  protected pullCommand(id: number) {
    const promise = this.commands.get(id)
    if (promise) {
      this.commands.delete(id)
      clearTimeout(promise.timeout)
    }
    return promise
  }

  public invoke(method: DeviceMethodName, params: any[] = []): Promise<any> {
    const command = { id: getNextId(), method, params }
    return new Promise((resolve, reject) => {
      this.commands.set(command.id, {
        timeout: setTimeout(() => {
          reject(new Error(`${ this.info.id }: failed to send cmd ${ command.id }.`))
          this.commands.delete(command.id)
        }, 100),
        resolve,
        reject,
      })
      this.emit('command', command)
      this.send(JSON.stringify(command) + EOL)
    })
  }

  public onMessage(data: Buffer) {
    const items = data.toString()
      .split(EOL)
      .filter(it => it)
      .map(payload => JSON.parse(payload))
    for (const item of items) {
      if (isPropsMessage(item)) {
        this.emit('updateProps', item.params)
      } else if (isResultMessage(item)) {
        this.pullCommand(item.id)?.resolve(item.result)
      } else if (isErrorMessage(item)) {
        this.pullCommand(item.id)?.reject(item.error.message)
      }
    }
  }

  async getProp(key: DevicePropName): Promise<string>
  async getProp(key: DevicePropName[]): Promise<Record<string, any>>
  async getProp(key: any): Promise<any> {
    const isArray = Array.isArray(key)
    const keys = isArray ? key : [key]
    const values = await this.invoke('get_prop', keys.map(v => toSnakeCase(v)))
    if (!isArray) return values[0]
    const props: Record<string, any> = {}
    keys.forEach((k, i) => {
      props[k] = values[i]
    })
    return props
  }

  setCtAbx(ct: number, effect: Effect = 'smooth', duration = 400) {
    return this.invoke('set_ct_abx', [ct, effect, duration])
  }

  setRgb(rgb: number, effect: Effect = 'smooth', duration = 400) {
    return this.invoke('set_rgb', [rgb, effect, duration])
  }

  setHsv(hue: number, sat: number, effect: Effect = 'smooth', duration = 400) {
    return this.invoke('set_hsv', [hue, sat, effect, duration])
  }

  setBright(brightness: number, effect: Effect = 'smooth', duration = 400) {
    return this.invoke('set_bright', [brightness, effect, duration])
  }

  setPower(power: 'on' | 'off', effect: Effect = 'smooth', duration = 400, mode: 0 | 1 | 2 | 3 | 4 | 5 = 0) {
    return this.invoke('set_power', [power, effect, duration, mode])
  }

  toggle() {
    return this.invoke('toggle')
  }

  setDefault() {
    return this.invoke('set_default')
  }
}
