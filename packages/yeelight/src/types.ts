export interface DeviceProps {
  // on: smart LED is turned on / off: smart LED is turned off
  power?: 'on' | 'off'
  // Brightness percentage. Range 1 ~ 100
  bright?: number
  // Color temperature. Range 1700 ~ 6500(k)
  // This field is only valid if COLOR_MODE is 2.
  ct?: number
  // Color. Range 1 ~ 16777215
  // The field is only valid if COLOR_MODE is 1.
  rgb?: number
  // Hue. Range 0 ~ 359
  // This field is only valid if COLOR_MODE is 3.
  hue?: number
  // Saturation. Range 0 ~ 100
  // The field is only valid if COLOR_MODE is 3.
  sat?: number
  // 1: rgb mode / 2: color temperature mode / 3: hsv mode
  color_mode?: 1 | 2 | 3
  // 0: no flow is running / 1:color flow is running
  flowing?: 0 | 1
  // The remaining time of a sleep timer. Range 1 ~ 60 (minutes)
  delayoff?: number
  // Current flow parameters (only meaningful when 'flowing' is 1)
  flow_params?: string
  // 1: Music mode is on / 0: Music mode is off
  music_on?: 1 | 0
  // Name of the device. User can use “set_name” to store the name on the device.
  // The maximum length is 64 bytes.
  // If none-ASCII character is used, it is suggested to BASE64 the name first and then use “set_name” to store it on device.
  name?: string
  // Background light power status
  bg_power?: 'on' | 'off'
  // Background light is flowingt
  bg_flowing?: 0 | 1
  // Current flow parameters of background ligh
  bg_flow_params?: string
  // Color temperature of background light
  bg_ct?: number
  // 1: rgb mode / 2: color temperature mode / 3: hsv mode
  bg_lmode?: 1 | 2 | 3
  // Brightness percentage of background light
  bg_bright?: number
  // Color of background light
  bg_rgb?: number
  // Hue of background light
  bg_hue?: number
  // Saturation of background light
  bg_sat?: number
  // Brightness of night mode light
  nl_br?: number
  // 0: daylight mode / 1: moonlight mode (ceiling light only)
  active_mode?: 0 | 1
}

export type DevicePropName = keyof DeviceProps

export type DeviceSupportedMethods = (
  'get_prop'
  | 'set_ct_abx'
  | 'set_rgb'
  | 'set_hsv'
  | 'set_bright'
  | 'set_power'
  | 'toggle'
  | 'set_default'
  | 'start_cf'
  | 'stop_cf'
  | 'set_scene'
  | 'cron_add'
  | 'cron_get'
  | 'cron_del'
  | 'set_adjust'
  | 'set_music'
  | 'set_name'
  | 'bg_set_rgb'
  | 'bg_set_hsv'
  | 'bg_set_ct_abx'
  | 'bg_start_cf'
  | 'bg_stop_cf'
  | 'bg_set_scene'
  | 'bg_set_default'
  | 'bg_set_power'
  | 'bg_set_bright'
  | 'bg_set_adjust'
  | 'bg_toggle'
  | 'dev_toggle'
  | 'adjust_bright'
  | 'adjust_ct'
  | 'adjust_color'
  | 'bg_adjust_bright'
  | 'bg_adjust_ct'
  | 'bg_adjust_color'
  | string
)[]

export type DeviceProductModel = 'mono'
| 'stripe'
| 'mono1'
| 'color'
| 'color1'
| 'strip1'
| 'RGBW'
| 'bslamp1'
| 'bslamp2'
| 'ceiling1'
| 'ceiling2'
| 'ceiling3'
| 'ceiling4'
| 'ceiling5'
| 'ceiling10'
| 'ceiling11'
| 'ceiling13'
| 'ceiling14'
| 'ceiling15'
| 'ceiling18'
| 'ceiling20'
| 'color2'
| 'color4'
| 'lamp1'
| 'lamp9'
| 'desklamp'
| 'ceila'
| 'ceilc'
| 'lamp15'
| string

export interface DeviceInfo extends DeviceProps {
  host: string
  port?: number
  from?: 'response' | 'notify' | string
  Server?: string
  // field contains the service access point of the smart LED deivce.
  // The URI scheme will always be "yeelight", host is the IP address of smart LED, port is control service's TCP listen port.
  Location?: string
  // The ID of a Yeelight WiFi LED device, 3rd party device should use this value to uniquely identified a Yeelight WiFi LED device.
  id?: string
  // The product model of a Yeelight smart device. Current it can be "mono", "color", “stripe”, “ceiling”, “bslamp”. For "mono", it represents device that only supports brightness adjustment.
  // For "color", it represents device that support both color and color temperature adjustment.
  // “Stripe” stands for Yeelight smart LED stripe.
  // “Ceiling” stands for Yeelight Ceiling Light.
  // More values may be added in future.
  model?: DeviceProductModel
  // LED device's firmware version.
  fw_ver?: string
  // All the supported control methods separated by white space.
  // 3Rd party device can use this field to dynamically render the control view to user if necessary.
  // Any control request that invokes method that is not included in this field will be rejected by smart LED
  support?: DeviceSupportedMethods
}

export type Transition = {
  effect?: 'sudden' | 'smooth'
  duration?: number
}
