import { Platform } from './Platform'
import type { API } from 'homebridge'

export default (api: API) => Platform.register(api)
