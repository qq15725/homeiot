import { MiIOClient } from './MiIOClient'

export class MIoT extends MiIOClient {
  protected baseUri = 'https://api.io.mi.com/app/miotspec'

  public getProps(did: number, iids: [number, number][]) {
    return this.request('/prop/get', {
      params: iids.map(val => ({ did, siid: val[0], piid: val[1] })),
    })
  }

  public getProp(did: number, iid: [number, number]) {
    return this.getProps(did, [iid]).then(val => val[0])
  }

  public setProps(did: number, props: [number, number, any][]) {
    return this.request('/prop/set', {
      params: props.map(val => ({ did, siid: val[0], piid: val[1], value: val[2] })),
    })
  }

  public setProp(did: number, iid: [number, number], value: any) {
    return this.setProps(did, [...iid, value])
  }

  public action(params: Record<string, any>) {
    return this.request('/action', { params })
  }
}
