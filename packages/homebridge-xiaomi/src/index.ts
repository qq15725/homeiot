import { createPlatform } from './platform'
import { platformId, platformName } from './constants'
import type { PlatformPluginConstructor } from 'homebridge/lib/api'
import type { API } from 'homebridge'

export default (api: API) => {
  api.registerPlatform(
    platformId,
    platformName,
    createPlatform as unknown as PlatformPluginConstructor,
  )
}
