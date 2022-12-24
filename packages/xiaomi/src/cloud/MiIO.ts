import { MiIOClient } from './MiIOClient'

export class MiIO extends MiIOClient {
  public call(did: number, method: string, params: any) {
    return this.request(`/home/rpc/${ did }`, {
      id: 1, method, params, accessKey: 'IOS00026747c5acafc2',
    })
  }

  public getProps(did: number, keys: string[]) {
    return this.call(did, 'get_prop', keys)
  }

  public getProp(did: number, key: string) {
    return this.getProps(did, [key]).then(res => res[0])
  }

  public setProp(did: number, key: string, value: any) {
    return this.call(did, `set_${ key }`, Array.isArray(value) ? value : [value])
  }

  public getDevices(options?: {
    getVirtualModel?: boolean
    getHuamiDevices?: 0 | 1
    get_split_device?: boolean
    support_smart_home?: boolean
    dids?: string[]
  }) {
    return this.request('/home/device_list', {
      getVirtualModel: true,
      getHuamiDevices: 1,
      get_split_device: false,
      support_smart_home: true,
      ...options,
    }).then(result => result.list)
  }

  public getHome(options?: {
    fetch_share_dev?: boolean
  }) {
    return this.request('/homeroom/gethome', {
      fetch_share_dev: false,
      ...options,
    }).then(result => result.homelist)
  }
}
