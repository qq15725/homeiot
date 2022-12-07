import { Device as BaseDevice } from '@homeiot/shared'
import { EOL } from './constants'
import { getNextId, isErrorMessage, isPropsMessage, isResultMessage, toSnakeCase } from './utils'
import { getSpec } from './specs'
import type {
  DeviceModelSpec,
  DevicePropName,
  DiscoveredDeviceInfo,
  Effect,
} from './types'

export class Device extends BaseDevice {
  protected readonly commands = new Map<number, { timeout: any; resolve: any; reject: any }>()
  public readonly spec: DeviceModelSpec

  constructor(
    public readonly info: DiscoveredDeviceInfo,
  ) {
    const endpoint = info.location.split('//')[1]
    const [host, port] = endpoint.split(':')
    super(host, Number(port), { type: 'tcp' })
    this.spec = getSpec(info)
  }

  protected pullCommand(id: number) {
    const promise = this.commands.get(id)
    if (promise) {
      this.commands.delete(id)
      clearTimeout(promise.timeout)
    }
    return promise
  }

  public invoke(method: string, params: any[] = []): Promise<any> {
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
      this.send(JSON.stringify(command) + EOL).catch(e => {
        reject(e)
        this.commands.delete(command.id)
      })
    })
  }

  public onMessage(data: Buffer) {
    const items = data.toString()
      .split(EOL)
      .filter(it => it)
      .map(payload => JSON.parse(payload))
    for (const item of items) {
      if (isPropsMessage(item)) {
        this.emit('props', item.params)
      } else if (isResultMessage(item)) {
        this.pullCommand(item.id)?.resolve(item.result)
      } else if (isErrorMessage(item)) {
        this.pullCommand(item.id)?.reject(item.error.message)
      }
    }
  }

  public async getProp(key: DevicePropName): Promise<string>
  public async getProp(key: DevicePropName[]): Promise<Record<string, any>>
  public async getProp(key: any): Promise<any> {
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

  public setCtAbx(ct: number, effect: Effect = 'smooth', duration = 400): Promise<void> {
    return this.invoke('set_ct_abx', [ct, effect, duration])
  }

  public setRgb(rgb: number, effect: Effect = 'smooth', duration = 400): Promise<void> {
    return this.invoke('set_rgb', [rgb, effect, duration])
  }

  public setHsv(hue: number, sat: number, effect: Effect = 'smooth', duration = 400): Promise<void> {
    return this.invoke('set_hsv', [hue, sat, effect, duration])
  }

  public setBright(brightness: number, effect: Effect = 'smooth', duration = 400): Promise<void> {
    return this.invoke('set_bright', [brightness, effect, duration])
  }

  public setPower(power: 'on' | 'off', effect: Effect = 'smooth', duration = 400, mode: 0 | 1 | 2 | 3 | 4 | 5 = 0): Promise<void> {
    return this.invoke('set_power', [power, effect, duration, mode])
  }

  public toggle(): Promise<void> {
    return this.invoke('toggle')
  }

  public setDefault(): Promise<void> {
    return this.invoke('set_default')
  }
}
