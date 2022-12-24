import { MinaClient } from './MinaClient'

export class Mina extends MinaClient {
  public getDevices(master = 0) {
    return this.request(`/admin/v2/device_list?master=${ master }`)
  }
}
