import { MiIOClient } from './MiIOClient'

export class MIoT extends MiIOClient {
  public getProps(did: number | string, iids: [number, number][]) {
    return this.request('/miotspec/prop/get', {
      params: iids.map(val => ({ did: String(did), siid: val[0], piid: val[1] })),
    })
  }

  public getProp(did: number | string, iid: [number, number]) {
    return this.getProps(did, [iid]).then(val => val[0])
  }

  public setProps(did: number | string, props: [number, number, any][]) {
    return this.request('/miotspec/prop/set', {
      params: props.map(val => ({ did: String(did), siid: val[0], piid: val[1], value: val[2] })),
    })
  }

  public setProp(did: number | string, iid: [number, number], value: any) {
    return this.setProps(did, [[...iid, value]]).then(res => res[0])
  }

  public action(params: Record<string, any>) {
    return this.request('/miotspec/action', { params })
  }
}
