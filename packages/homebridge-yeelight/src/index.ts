import { PLATFORM, PLUGIN_NAME } from './constants'
import { YeelightPlatform } from './platform'
import type { API } from 'homebridge'

export default (api: API) => {
  api.registerPlatform(PLUGIN_NAME, PLATFORM, YeelightPlatform)
}
