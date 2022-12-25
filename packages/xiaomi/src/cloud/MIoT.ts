import { MiIOClient } from './MiIOClient'

export class MIoT extends MiIOClient {
  protected resovleIid(iid: string) {
    const [siid, piid] = iid
      .replace(/^0\./, '')
      .split('.')
    return { siid: Number(siid), piid: Number(piid) }
  }

  public getProps(did: number | string, iids: string[]) {
    return this.request('/miotspec/prop/get', {
      params: iids.map(iid => {
        const { siid, piid } = this.resovleIid(iid)
        return { did: String(did), siid, piid }
      }),
    })
  }

  public async getProp(did: number | string, iid: string) {
    const result = await this.getProps(did, [iid]).then(res => res[0])
    this.catchError(result.code)
    return result
  }

  public setProps(did: number | string, props: [string, any][]) {
    return this.request('/miotspec/prop/set', {
      params: props.map(val => {
        const { siid, piid } = this.resovleIid(val[0])
        return { did: String(did), siid, piid, value: val[1] }
      }),
    })
  }

  public async setProp(did: number | string, iid: string, value: any) {
    const result = await this.setProps(did, [[iid, value]]).then(res => res[0])
    this.catchError(result.code)
    return result
  }

  public async action(did: number | string, iid: string, args: any[]) {
    const { siid, piid } = this.resovleIid(iid)
    const result = await this.request('/miotspec/action', {
      params: {
        did: String(did), siid, aiid: piid, in: args,
      },
    })
    this.catchError(result.code)
    return result
  }
}
