import { PLATFORM, PLUGIN_NAME } from './constants'
import { Platform } from './Platform'
import type { API } from 'homebridge'

export default (api: API) => {
  api.registerPlatform(PLUGIN_NAME, PLATFORM, Platform)
}
