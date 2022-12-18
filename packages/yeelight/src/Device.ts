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
  private static requestAutoIncrementId = 0

  // The ID of a Yeelight WiFi LED device, 3rd party device should use this value to uniquely identified a Yeelight WiFi LED device.
  public get id(): string | undefined {
    return this.getAttribute('id')
  }

  // The product model of a Yeelight smart device. Current it can be "mono", "color", “stripe”, “ceiling”, “bslamp”. For "mono", it represents device that only supports brightness adjustment.
  // For "color", it represents device that support both color and color temperature adjustment.
  // “Stripe” stands for Yeelight smart LED stripe.
  // “Ceiling” stands for Yeelight Ceiling Light.
  // More values may be added in future.
  public get model(): DeviceProductModel | undefined {
    return this.getAttribute('model')
  }

  // Model name
  public readonly modelName?: string
  // Support color temperature
  public readonly supportColorTemperature: false | { min: number; max: number }
  // Support night light
  public readonly supportNightLight: boolean
  // Support background light
  public readonly supportBackgroundLight: boolean
  // Support color
  public readonly supportColor: boolean

  // TCP
  public get from(): 'response' | 'notify' | string | undefined {
    return this.getAttribute('from')
  }

  // field contains the service access point of the smart LED deivce.
  // The URI scheme will always be "yeelight", host is the IP address of smart LED, port is control service's TCP listen port.
  public get location(): string | undefined {
    return this.getAttribute('location')
  }

  // LED device's firmware version.
  public get fwVer(): string | undefined {
    return this.getAttribute('fwVer')
  }

  // All the supported control methods separated by white space.
  // 3Rd party device can use this field to dynamically render the control view to user if necessary.
  // Any control request that invokes method that is not included in this field will be rejected by smart LED
  public get support(): DeviceSupportedMethods | undefined {
    return this.getAttribute('support')
  }

  // Props

  // on: smart LED is turned on / off: smart LED is turned off
  public get power(): 'on' | 'off' | undefined {
    return this.getAttribute('power')
  }

  public set power(value) {
    if (value === undefined) {
      this.setAttribute('power', value)
    } else if (this.power !== value) {
      this.setPower(value)
        .then(() => this.setAttribute('power', value))
        .catch(err => this.emit('error', err))
    }
  }

  // Brightness percentage. Range 1 ~ 100
  // Brightness percentage. Range 1 ~ 100
  public get bright(): number | undefined {
    return this.getAttribute('bright')
  }

  public set bright(value) {
    if (value === undefined) {
      this.setAttribute('bright', value)
    } else if (this.bright !== value) {
      this.setBright(value)
        .then(() => this.setAttribute('bright', value))
        .catch(err => this.emit('error', err))
    }
  }

  // Color temperature. Range 1700 ~ 6500(k)
  // This field is only valid if COLOR_MODE is 2.
  public get ct(): number | undefined {
    return this.getAttribute('ct')
  }

  public set ct(value) {
    if (value === undefined) {
      this.setAttribute('ct', value)
    } else if (this.ct !== value) {
      this.setCtAbx(value)
        .then(() => this.setAttribute('ct', value))
        .catch(err => this.emit('error', err))
    }
  }

  // Color. Range 1 ~ 16777215
  // The field is only valid if COLOR_MODE is 1.
  public get rgb(): number | undefined {
    return this.getAttribute('rgb')
  }

  public set rgb(value) {
    if (value === undefined) {
      this.setAttribute('rgb', value)
    } else if (this.rgb !== value) {
      this.setRgb(value)
        .then(() => this.setAttribute('rgb', value))
        .catch(err => this.emit('error', err))
    }
  }

  // Hue. Range 0 ~ 359
  // This field is only valid if COLOR_MODE is 3.
  public get hue(): number | undefined {
    return this.getAttribute('hue')
  }

  public set hue(value) {
    if (value === undefined) {
      this.setAttribute('hue', value)
    } else if (this.hue !== value && this.sat && value) {
      this.setHsv(value, this.sat)
        .then(() => this.setAttribute('hue', value))
        .catch(err => this.emit('error', err))
    }
  }

  // Saturation. Range 0 ~ 100
  // The field is only valid if COLOR_MODE is 3.
  public get sat(): number | undefined {
    return this.getAttribute('sat')
  }

  public set sat(value) {
    if (value === undefined) {
      this.setAttribute('sat', value)
    } else if (this.sat !== value && this.hue && value) {
      this.setHsv(this.hue, value)
        .then(() => this.setAttribute('sat', value))
        .catch(err => this.emit('error', err))
    }
  }

  // 1: rgb mode / 2: color temperature mode / 3: hsv mode
  public get colorMode(): 1 | 2 | 3 | undefined {
    return this.getAttribute('colorMode')
  }

  // 0: no flow is running / 1:color flow is running
  public get flowing(): 0 | 1 | undefined {
    return this.getAttribute('flowing')
  }

  // The remaining time of a sleep timer. Range 1 ~ 60 (minutes)
  public delayoff?: number
  // Current flow parameters (only meaningful when 'flowing' is 1)
  public flowParams?: string
  // 1: Music mode is on / 0: Music mode is off
  public musicOn?: 1 | 0
  // Name of the device. User can use “set_name” to store the name on the device.
  // The maximum length is 64 bytes.
  // If none-ASCII character is used, it is suggested to BASE64 the name first and then use “set_name” to store it on device.
  public get name(): string | undefined {
    return this.getAttribute('name')
  }

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

  public get displayName(): string {
    return this.name || this.modelName || this.model || 'unknown'
  }

  constructor(info: DeviceInfo) {
    const { host, port, ...props } = info
    super(host, port, { type: 'tcp' })
    const parsedModel = parseModel(info.model, info.support)
    this.modelName = parsedModel.modelName
    this.supportColorTemperature = parsedModel.supportColorTemperature as any
    this.supportNightLight = parsedModel.supportNightLight
    this.supportBackgroundLight = parsedModel.supportBackgroundLight
    this.supportColor = parsedModel.supportColor
    this.setAttributes(props)
  }

  public call(method: string, params: any[] = []): Promise<any> {
    const id = ++Device.requestAutoIncrementId
    return this
      .request(String(id), JSON.stringify({ id, method, params }) + EOL)
      .then(val => val.result)
  }

  public onMessage(message: Buffer) {
    const items = message
      .toString()
      .split(EOL)
      .filter(Boolean)
      .map(v => JSON.parse(v))

    for (const data of items) {
      if (
        'method' in data
        && 'params' in data
        && data.method === 'props'
      ) {
        this.emit('update:props', data.params)
      } else if (
        'id' in data
        && 'result' in data
      ) {
        this.pullWaitingRequest(String(data.id))?.resolve(data)
      } else if (
        'id' in data
        && 'error' in data
        && 'code' in data.error
        && 'message' in data.error
      ) {
        this.pullWaitingRequest(String(data.id))?.reject(data.error.message)
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
