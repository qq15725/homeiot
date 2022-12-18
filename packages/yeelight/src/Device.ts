import { BaseDevice } from '@homeiot/shared'
import { EOL, toSnakeCase } from './utils'
import { parseModel } from './model'
import type {
  DeviceInfo,
  DeviceProductModel,
  DevicePropName,
  DeviceSupportedMethods,
  Transition,
} from './types'

export class Device extends BaseDevice {
  private static autoIncrementId = ~~(Math.random() * 10000)
  private static callAutoIncrementId = ~~(Math.random() * 10000)

  // TCP
  public from?: 'response' | 'notify' | string

  // Message
  // The ID of a Yeelight WiFi LED device, 3rd party device should use this value to uniquely identified a Yeelight WiFi LED device.
  public readonly id: string
  // field contains the service access point of the smart LED deivce.
  // The URI scheme will always be "yeelight", host is the IP address of smart LED, port is control service's TCP listen port.
  public location?: string
  // The product model of a Yeelight smart device. Current it can be "mono", "color", “stripe”, “ceiling”, “bslamp”. For "mono", it represents device that only supports brightness adjustment.
  // For "color", it represents device that support both color and color temperature adjustment.
  // “Stripe” stands for Yeelight smart LED stripe.
  // “Ceiling” stands for Yeelight Ceiling Light.
  // More values may be added in future.
  public model?: DeviceProductModel
  // LED device's firmware version.
  public fwVer?: string
  // All the supported control methods separated by white space.
  // 3Rd party device can use this field to dynamically render the control view to user if necessary.
  // Any control request that invokes method that is not included in this field will be rejected by smart LED
  public support?: DeviceSupportedMethods

  // Props
  // on: smart LED is turned on / off: smart LED is turned off
  public power?: 'on' | 'off'
  // Brightness percentage. Range 1 ~ 100
  // Brightness percentage. Range 1 ~ 100
  public bright?: number
  // Color temperature. Range 1700 ~ 6500(k)
  // This field is only valid if COLOR_MODE is 2.
  public ct?: number
  // Color. Range 1 ~ 16777215
  // The field is only valid if COLOR_MODE is 1.
  public rgb?: number
  // Hue. Range 0 ~ 359
  // This field is only valid if COLOR_MODE is 3.
  public hue?: number
  // Saturation. Range 0 ~ 100
  // The field is only valid if COLOR_MODE is 3.
  public sat?: number
  // 1: rgb mode / 2: color temperature mode / 3: hsv mode
  public colorMode?: 1 | 2 | 3
  // 0: no flow is running / 1:color flow is running
  public flowing?: 0 | 1
  // The remaining time of a sleep timer. Range 1 ~ 60 (minutes)
  public delayoff?: number
  // Current flow parameters (only meaningful when 'flowing' is 1)
  public flowParams?: string
  // 1: Music mode is on / 0: Music mode is off
  public musicOn?: 1 | 0
  // Name of the device. User can use “set_name” to store the name on the device.
  // The maximum length is 64 bytes.
  // If none-ASCII character is used, it is suggested to BASE64 the name first and then use “set_name” to store it on device.
  public name?: string
  // Background light power status
  public bgPower?: 'on' | 'off'
  // Background light is flowingt
  public bgFlowing?: 0 | 1
  // Current flow parameters of background ligh
  public bgFlowParams?: string
  // Color temperature of background light
  public bgCt?: number
  // 1: rgb mode / 2: color temperature mode / 3: hsv mode
  public bgLmode?: 1 | 2 | 3
  // Brightness percentage of background light
  public bgBright?: number
  // Color of background light
  public bgRgb?: number
  // Hue of background light
  public bgHue?: number
  // Saturation of background light
  public bgSat?: number
  // Brightness of night mode light
  public nlBr?: number
  // 0: daylight mode / 1: moonlight mode (ceiling light only)
  public activeMode?: 0 | 1

  // Model
  public modelName?: string
  // Supports color temperature
  public supportsColorTemperature: false | { min: number; max: number } = false
  // Supports night light
  public supportsNightLight = false
  // Supports background light
  public supportsBackgroundLight = false
  // Supports color
  public supportsColor = false

  public get displayName(): string {
    return this.name || this.modelName || this.model || 'unknown'
  }

  constructor(info: DeviceInfo) {
    const { host, port, id, ...props } = info
    super(host, port, { type: 'tcp' })
    this.id = id ?? `id_${ ++Device.autoIncrementId }`
    this.setObject({ ...props, ...parseModel(info.model, info.support) })
  }

  public call(method: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = ++Device.callAutoIncrementId
      this
        .setPromose(id, resolve, reject)
        .send(JSON.stringify({ id, method, params }) + EOL)
        .catch(e => {
          reject(e)
          this.pullPromise(id)
        })
    })
  }

  public onMessage(data: Buffer) {
    for (const message of data.toString().split(EOL).filter(Boolean).map(v => JSON.parse(v))) {
      if (
        'method' in message
        && 'params' in message
        && message.method === 'props'
      ) {
        this.emit('updated', message.params)
      } else if (
        'id' in message
        && 'result' in message
        && Array.isArray(message.result)
      ) {
        this.pullPromise(message.id)?.resolve(message.result)
      } else if (
        'id' in message
        && 'error' in message
        && 'code' in message.error
        && 'message' in message.error
      ) {
        this.pullPromise(message.id)?.reject(message.error.message)
      }
    }
  }

  public async getProp(key: DevicePropName): Promise<string>
  public async getProp(key: DevicePropName[]): Promise<Record<string, any>>
  public async getProp(key: any): Promise<any> {
    const isArray = Array.isArray(key)
    const keys = isArray ? key : [key]
    const values = await this.call('get_prop', keys.map(v => toSnakeCase(v)))
    if (!isArray) return values[0]
    const props: Record<string, any> = {}
    keys.forEach((k, i) => {
      props[k] = values[i]
    })
    return props
  }

  public setCtAbx(ct: number, transition?: Transition): Promise<void> {
    return this.call('set_ct_abx', [
      ct,
      transition?.effect ?? 'smooth',
      transition?.duration ?? 400,
    ])
  }

  public setRgb(rgb: number, transition?: Transition): Promise<void> {
    return this.call('set_rgb', [
      rgb,
      transition?.effect ?? 'smooth',
      transition?.duration ?? 400,
    ])
  }

  public setHsv(hue: number, sat: number, transition?: Transition): Promise<void> {
    return this.call('set_hsv', [
      hue, sat,
      transition?.effect ?? 'smooth',
      transition?.duration ?? 400,
    ])
  }

  public setBright(brightness: number, transition?: Transition): Promise<void> {
    return this.call('set_bright', [
      brightness,
      transition?.effect ?? 'smooth',
      transition?.duration ?? 400,
    ])
  }

  public setPower(power: 'on' | 'off', mode: 0 | 1 | 2 | 3 | 4 | 5 = 0, transition?: Transition): Promise<void> {
    return this.call('set_power', [
      power,
      transition?.effect ?? 'smooth',
      transition?.duration ?? 400,
      mode,
    ])
  }

  public toggle(): Promise<void> {
    return this.call('toggle')
  }

  public setDefault(): Promise<void> {
    return this.call('set_default')
  }
}
