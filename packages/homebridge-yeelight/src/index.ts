import { createPlatform } from './platform'
import { platformId, platformName } from './constants'
import type { API } from 'homebridge'
import type { PlatformPluginConstructor } from 'homebridge/lib/api'

export default (api: API) => {
  api.registerPlatform(
    platformId,
    platformName,
    createPlatform as unknown as PlatformPluginConstructor,
  )
}
