import type { ModelCharacteristic } from './model-characteristic'

export interface ModelService {
  uuid: any
  subType?: string
  displayName?: string
  characteristics?: (ModelCharacteristic | false)[]
}
