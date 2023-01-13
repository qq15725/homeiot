import { BaseDevice } from '@homeiot/shared'
import { EOL } from './utils'
import { parseModel } from './model'
import type {
  DeviceInfo,
  DeviceProductModel,
  DevicePropName,
  DeviceSupportedMethods,
  Transition,
} from './types'

export class Device extends BaseDevice {
  // The ID of a Yeelight WiFi LED device, 3rd party device should use this value to uniquely identified a Yeelight WiFi LED device.
  public get id(): string | undefined {
    return this.get('id')
  }

  // The product model of a Yeelight smart device. Current it can be "mono", "color", “stripe”, “ceiling”, “bslamp”. For "mono", it represents device that only supports brightness adjustment.
  // For "color", it represents device that support both color and color temperature adjustment.
  // “Stripe” stands for Yeelight smart LED stripe.
  // “Ceiling” stands for Yeelight Ceiling Light.
  // More values may be added in future.
  public get model(): DeviceProductModel | undefined {
    return this.get('model')
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
    return this.get('from')
  }

  // field contains the service access point of the smart LED deivce.
  // The URI scheme will always be "yeelight", host is the IP address of smart LED, port is control service's TCP listen port.
  public get location(): string | undefined {
    return this.get('Location')
  }

  // LED device's firmware version.
  public get fwVer(): string | undefined {
    return this.get('fw_ver')
  }

  // All the supported control methods separated by white space.
  // 3Rd party device can use this field to dynamically render the control view to user if necessary.
  // Any control request that invokes method that is not included in this field will be rejected by smart LED
  public get support(): DeviceSupportedMethods | undefined {
    return this.get('support')
  }

  // Props

  // on: smart LED is turned on / off: smart LED is turned off
  public get power(): 'on' | 'off' | undefined {
    return this.get('power')
  }

  public set power(value) {
    if (value !== undefined && this.power !== value) {
      this.setPower(value).catch(this.onError.bind(this))
    }
    this.set('power', value)
  }

  // Brightness percentage. Range 1 ~ 100
  public get bright(): number | undefined {
    return this.get('bright')
  }

  public set bright(value) {
    if (value !== undefined && this.bright !== value) {
      this.setBright(value).catch(this.onError.bind(this))
    }
    this.set('bright', value)
  }

  // Color temperature. Range 1700 ~ 6500(k)
  // This field is only valid if COLOR_MODE is 2.
  public get ct(): number | undefined {
    return this.get('ct')
  }

  public set ct(value) {
    if (value !== undefined && this.ct !== value) {
      this.setCtAbx(value).catch(this.onError.bind(this))
    }
    this.set('ct', value)
  }

  // Color. Range 1 ~ 16777215
  // The field is only valid if COLOR_MODE is 1.
  public get rgb(): number | undefined {
    return this.get('rgb')
  }

  public set rgb(value) {
    if (value !== undefined && this.rgb !== value) {
      this.setRgb(value).catch(this.onError.bind(this))
    }
    this.set('rgb', value)
  }

  // Hue. Range 0 ~ 359
  // This field is only valid if COLOR_MODE is 3.
  public get hue(): number | undefined {
    return this.get('hue')
  }

  public set hue(value) {
    if (value !== undefined && this.hue !== value && this.sat !== undefined) {
      this.setHsv(value, this.sat).catch(this.onError.bind(this))
    }
    this.set('hue', value)
  }

  // Saturation. Range 0 ~ 100
  // The field is only valid if COLOR_MODE is 3.
  public get sat(): number | undefined {
    return this.get('sat')
  }

  public set sat(value) {
    if (value !== undefined && this.sat !== value && this.hue !== undefined) {
      this.setHsv(this.hue, value).catch(this.onError.bind(this))
    }
    this.set('sat', value)
  }

  // 1: rgb mode / 2: color temperature mode / 3: hsv mode
  public get colorMode(): 1 | 2 | 3 | undefined {
    return this.get('color_mode')
  }

  // 0: no flow is running / 1:color flow is running
  public get flowing(): 0 | 1 | undefined {
    return this.get('flowing')
  }

  // The remaining time of a sleep timer. Range 1 ~ 60 (minutes)
  public get delayoff(): number | undefined {
    return this.get('delayoff')
  }

  // Current flow parameters (only meaningful when 'flowing' is 1)
  public get flowParams(): string | undefined {
    return this.get('flow_params')
  }

  // 1: Music mode is on / 0: Music mode is off
  public get musicOn(): 1 | 0 | undefined {
    return this.get('music_on')
  }

  // Name of the device. User can use “set_name” to store the name on the device.
  // The maximum length is 64 bytes.
  // If none-ASCII character is used, it is suggested to BASE64 the name first and then use “set_name” to store it on device.
  public get name(): string | undefined {
    return this.get('name')
  }

  // Background light power status
  public get bgPower(): 'on' | 'off' | undefined {
    return this.get('bg_power')
  }

  // Background light is flowingt
  public get bgFlowing(): 0 | 1 | undefined {
    return this.get('bg_flowing')
  }

  // Current flow parameters of background ligh
  public get bgFlowParams(): string | undefined {
    return this.get('bg_flow_params')
  }

  // Color temperature of background light
  public get bgCt(): number | undefined {
    return this.get('bg_ct')
  }

  // 1: rgb mode / 2: color temperature mode / 3: hsv mode
  public get bgLmode(): 1 | 2 | 3 | undefined {
    return this.get('bg_lmode')
  }

  // Brightness percentage of background light
  public get bgBright(): number | undefined {
    return this.get('bg_bright')
  }

  // Color of background light
  public get bgRgb(): number | undefined {
    return this.get('bg_rgb')
  }

  // Hue of background light
  public get bgHue(): number | undefined {
    return this.get('bg_hue')
  }

  // Saturation of background light
  public get bgSat(): number | undefined {
    return this.get('bg_sat')
  }

  // Brightness of night mode light
  public get nlBr(): number | undefined {
    return this.get('nl_br')
  }

  // 0: daylight mode / 1: moonlight mode (ceiling light only)
  public get activeMode(): 0 | 1 | undefined {
    return this.get('active_mode')
  }

  public get displayName(): string {
    return this.name || this.modelName || this.model || 'unknown'
  }

  constructor(info: DeviceInfo) {
    const { host, port = 55443, ...props } = info
    super(host, port, props, { type: 'tcp' })
    const model = parseModel(info.model, info.support)
    this.modelName = model.modelName
    this.supportColorTemperature = model.supportColorTemperature as any
    this.supportNightLight = model.supportNightLight
    this.supportBackgroundLight = model.supportBackgroundLight
    this.supportColor = model.supportColor
  }

  public call(method: string, params: any[] = []): Promise<any> {
    const uuid = this.uuid()
    const data = JSON.stringify({ id: Number(uuid), method, params })
    const options = { keepAlive: true, uuid }
    return this.request(data, options).then(val => val.result)
  }

  protected onMessage(message: Buffer) {
    const items = message
      .toString()
      .split(EOL)
      .filter(Boolean)
      .map(v => JSON.parse(v))

    for (const data of items) {
      if ('method' in data && 'params' in data && data.method === 'props') {
        this.emit('update:props', data.params)
      } else if ('id' in data && 'result' in data) {
        this.getWaitingRequest(String(data.id))?.resolve(data)
      } else if (
        'id' in data
        && 'error' in data
        && 'code' in data.error
        && 'message' in data.error
      ) {
        this.getWaitingRequest(String(data.id))?.reject(new Error(data.error.message))
      }
    }
  }

  /**
   * This method is used to retrieve current property of smart LED.
   * @param key
   */
  public async getProp(key: DevicePropName): Promise<string>
  public async getProp(key: DevicePropName[]): Promise<Record<string, any>>
  public async getProp(key: any): Promise<any> {
    const isArray = Array.isArray(key)
    const keys = isArray ? key : [key]
    const values = await this.call('get_prop', keys)
    if (!isArray) return values[0]
    const props: Record<string, any> = {}
    keys.forEach((k, i) => {
      props[k] = values[i]
    })
    return props
  }

  /**
   * This method is used to change the color temperature of a smart LED.
   * @param ctValue is the target color temperature. The type is integer and
   * range is 1700 ~ 6500 (k).
   * @param transition
   */
  public setCtAbx(ctValue: number, transition?: Transition): Promise<void> {
    return this.call('set_ct_abx', [
      ctValue,
      transition?.effect ?? 'smooth',
      transition?.duration ?? 400,
    ])
  }

  /**
   * This method is used to change the color of a smart LED.
   * @param rgbValue is the target color, whose type is integer. It should be
   * expressed in decimal integer ranges from 0 to 16777215 (hex: 0xFFFFFF).
   * @param transition
   */
  public setRgb(rgbValue: number, transition?: Transition): Promise<void> {
    return this.call('set_rgb', [
      rgbValue,
      transition?.effect ?? 'smooth',
      transition?.duration ?? 400,
    ])
  }

  /**
   * This method is used to change the color of a smart LED.
   * @param hue is the target hue value, whose type is integer. It should be
   * expressed in decimal integer ranges from 0 to 359.
   * @param sat is the target saturation value whose type is integer. It's range is 0
   * to 100.
   * @param transition
   */
  public setHsv(hue: number, sat: number, transition?: Transition): Promise<void> {
    return this.call('set_hsv', [
      hue, sat,
      transition?.effect ?? 'smooth',
      transition?.duration ?? 400,
    ])
  }

  /**
   * This method is used to change the brightness of a smart LED.
   * @param brightness is the target brightness. The type is integer and ranges
   * from 1 to 100. The brightness is a percentage instead of a absolute value. 100 means
   * maximum brightness while 1 means the minimum brightness.
   * @param transition
   */
  public setBright(brightness: number, transition?: Transition): Promise<void> {
    return this.call('set_bright', [
      brightness,
      transition?.effect ?? 'smooth',
      transition?.duration ?? 400,
    ])
  }

  /**
   * This method is used to switch on or off the smart LED (software managed on/off).
   * @param power can only be "on" or "off". "on" means turn on the smart LED,
   * "off" means turn off the smart LED.
   * @param mode (optional)
   *  0: Normal turn on operation (default value)
   *  1: Turn on and switch to CT mode.
   *  2: Turn on and switch to RGB mode.
   *  3: Turn on and switch to HSV mode.
   *  4: Turn on and switch to color flow mode.
   *  5: Turn on and switch to Night light mode. (Ceiling light only).
   * @param transition
   */
  public setPower(power: 'on' | 'off', mode: 0 | 1 | 2 | 3 | 4 | 5 = 0, transition?: Transition): Promise<void> {
    return this.call('set_power', [
      power,
      transition?.effect ?? 'smooth',
      transition?.duration ?? 400,
      mode,
    ])
  }

  /**
   * This method is used to toggle the smart LED.
   */
  public toggle(): Promise<void> {
    return this.call('toggle')
  }

  /**
   * This method is used to save current state of smart LED in persistent
   * memory. So if user powers off and then powers on the smart LED again (hard power reset),
   * the smart LED will show last saved state.
   */
  public setDefault(): Promise<void> {
    return this.call('set_default')
  }

  /**
   * This method is used to start a color flow. Color flow is a series of smart
   * LED visible state changing. It can be brightness changing, color changing or color
   * temperature changing.This is the most powerful command. All our recommended scenes,
   * e.g. Sunrise/Sunset effect is implemented using this method. With the flow expression, user
   * can actually “program” the light effect.
   * @example
   *  startCf('1000, 2, 2700, 100, 500, 1, 255, 10, 5000, 7, 0,0, 500, 2, 5000, 1', 4, 2)
   * @param flowExpression is the expression of the state changing series.
   * [duration, mode, value, brightness]:
   * Duration: Gradual change time or sleep time, in milliseconds,
   * minimum value 50.
   * Mode: 1 – color, 2 – color temperature, 7 – sleep.
   * Value: RGB value when mode is 1, CT value when mode is 2,
   * Ignored when mode is 7.
   * Brightness: Brightness value, -1 or 1 ~ 100. Ignored when mode is 7.
   * When this value is -1, brightness in this tuple is ignored (only color or CT change takes
   * effect).
   *  Only accepted if the smart LED is currently in "on" state
   * @param count is the total number of visible state changing before color flow stopped. 0 means infinite loop on the state changing.
   * @param action is the action taken after the flow is stopped.
   *  0 means smart LED recover to the state before the color flow started.
   *  1 means smart LED stay at the state when the flow is stopped.
   *  2 means turn off the smart LED after the flow is stopped.
   */
  public startCf(flowExpression: string, count = 0, action: 0 | 1 | 2 = 0) {
    return this.call('start_cf', [count, action, flowExpression])
  }

  /**
   * This method is used to stop a running color flow.
   */
  public stopCf() {
    return this.call('stop_cf')
  }

  /**
   * This method is used to set the smart LED directly to specified state. If
   * the smart LED is off, then it will turn on the smart LED firstly and then apply the specified
   * command.
   * @example
   *   setScene('color', 65280, 70)
   *   setScene('hsv', 300, 70, 100)
   *   setScene('ct', 5400, 100)
   *   setScene('cf', 0, 0, '500, 1, 255, 100, 1000, 1, 16776960, 70')
   *   setScene('auto_delay_off', 50, 5)
   * @param klass can be "color", "hsv", "ct", "cf", "auto_dealy_off".
   *   "color" means change the smart LED to specified color and brightness.
   *   "hsv" means change the smart LED to specified color and brightness.
   *   "ct" means change the smart LED to specified ct and brightness.
   *   "cf" means start a color flow in specified fashion.
   *   "auto_delay_off" means turn on the smart LED to specified
   *   brightness and start a sleep timer to turn off the light after the specified minutes.
   * @param args
   */
  public setScene(klass: 'color' | 'hsv' | 'ct' | 'cf' | 'auto_dealy_off', ...args: any[]) {
    return this.call('set_scene', [klass, ...args])
  }

  /**
   * This method is used to start a timer job on the smart LED.
   * @param value is the length of the timer (in minutes).
   * @param type currently can only be 0. (means power off)
   */
  public cronAdd(value: number, type = 0) {
    return this.call('cron_add', [type, value])
  }

  /**
   * This method is used to retrieve the setting of the current cron job of the specified type.
   * @param type the type of the cron job. (currently only support 0).
   */
  public cronGet(type = 0) {
    return this.call('cron_get', [type])
  }

  /**
   * This method is used to stop the specified cron job.
   * @param type the type of the cron job. (currently only support 0).
   */
  public cronDel(type = 0) {
    return this.call('cron_del', [type])
  }

  /**
   * This method is used to change brightness, CT or color of a smart LED
   * without knowing the current value, it's main used by controllers.
   * @param action the direction of the adjustment. The valid value can be:
   *  increase: increase the specified property
   *  decrease: decrease the specified property
   *  circle: increase the specified property, after it reaches the max
   *  value, go back to minimum value.
   * @param prop the property to adjust. The valid value can be:
   *  bright: adjust brightness.
   *  ct: adjust color temperature.
   *  color: adjust color. (When “prop" is “color", the “action" can only
   *  be circle, otherwise, it will be deemed as invalid request.)
   */
  public setAdjust(action: 'increase' | 'decrease' | 'circle', prop: 'bright' | 'ct' | 'color') {
    return this.call('set_adjust', [action, prop])
  }

  /**
   * This method is used to start or stop music mode on a device. Under music
   * mode, no property will be reported and no message quota is checked.
   * @param host the IP address of the music server.
   * @param port the TCP port music application is listening on.
   * @param action the action of set_music command. The valid value can be:
   *  0: turn off music mode.
   *  1: turn on music mode.
   */
  public setMusic(host: string, port: number, action: 0 | 1 = 1) {
    return this.call('set_music', [action, host, port])
  }

  /***
   * This method is used to name the device. The name will be stored on the
   * device and reported in discovering response. User can also read the name through “get_prop”
   * method.
   * @param name the name of the device.
   */
  public setName(name: string) {
    return this.call('set_name', [name])
  }

  // bg_set_xx / bg_toggle

  /**
   * This method is used to toggle the main light and background light at the
   * same time.
   */
  public devToggle() {
    return this.call('dev_toggle')
  }

  /**
   * This method is used to adjust the brightness by specified percentage
   * within specified duration.
   * @param percentage the percentage to be adjusted. The range is: -100 ~ 100
   * @param duration Refer to "set_ct_abx" method.
   */
  public adjustBright(percentage: number, duration: number) {
    return this.call('adjust_bright', [percentage, duration])
  }

  /**
   * This method is used to adjust the color temperature by specified
   * percentage within specified duration.
   * @param percentage the percentage to be adjusted. The range is: -100 ~ 100
   * @param duration Refer to "set_ct_abx" method.
   */
  public adjustCt(percentage: number, duration: number) {
    return this.call('adjust_ct', [percentage, duration])
  }

  /**
   * This method is used to adjust the color within specified duration.
   * @param percentage the percentage to be adjusted. The range is: -100 ~ 100
   * @param duration Refer to "set_ct_abx" method.
   */
  public adjustColor(percentage: number, duration: number) {
    return this.call('adjust_color', [percentage, duration])
  }

  // bg_adjust_xx

  public toObject(): DeviceInfo {
    return super.toObject() as DeviceInfo
  }
}
