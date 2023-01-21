import { BaseDevice } from '@homeiot/shared'
import { Protocol } from './protocol'
import { Service } from './service'
import type { MIoTSpecAction, MIoTSpecInstance, MIoTSpecProperty } from './service'
import type { DeviceInfo } from './types'

export class Device extends BaseDevice {
  public get id(): string {
    return `xiaomi_${ this.did }`
  }

  public get did(): number {
    return this.get('did')
  }

  public get token(): string | undefined {
    return this.get('token')
  }

  public get stamp(): number | undefined {
    return this.get('stamp')
  }

  public get timestamp(): number | undefined {
    return this.get('timestamp')
  }

  public get model(): string | undefined {
    return this.get('model')
  }

  private _specInfo?: {
    name: string | undefined
    nameIid: Map<string, string>
    properties: Map<string, MIoTSpecProperty>
    actions: Map<string, MIoTSpecAction>
  }

  public get spec(): (
    MIoTSpecInstance & {
      name: string | undefined
      nameIid: Map<string, string>
      properties: Map<string, MIoTSpecProperty>
      actions: Map<string, MIoTSpecAction>
    }
  ) | undefined {
    const spec = this.get('spec') as MIoTSpecInstance | undefined

    if (!spec) return undefined

    if (!this._specInfo) {
      const name = spec?.type ? this.service.miotSpec.parseType(spec.type).name : undefined
      const nameIid = new Map<string, string>()
      const properties = new Map<string, MIoTSpecProperty>()
      const actions = new Map<string, MIoTSpecAction>()
      spec?.services.forEach(service => {
        const { name: serviceName } = this.service.miotSpec.parseType(service.type)
        service.properties?.forEach(property => {
          const { name: propertyName } = this.service.miotSpec.parseType(property.type)
          const name = `${ serviceName.replace('.', '_') }:${ propertyName.replace('.', '_') }`
          nameIid.set(name, `${ service.iid }.${ property.iid }`)
          properties.set(name, property)
        })
        service.actions?.forEach(action => {
          const { name: actionName } = this.service.miotSpec.parseType(action.type)
          const name = `${ serviceName.replace('.', '_') }:${ actionName.replace('.', '_') }`
          nameIid.set(name, `${ service.iid }.${ action.iid }`)
          actions.set(name, action)
        })
      })
      this._specInfo = {
        name,
        nameIid,
        properties,
        actions,
      }
    }

    return {
      ...spec,
      ...this._specInfo,
    }
  }

  public readonly protocol: Protocol
  public readonly service: Service
  public enableLANControl = false

  constructor(info: DeviceInfo) {
    const { host = '0.0.0.0', port = 54321, serviceTokens, ...attributes } = info
    super(host, port, attributes, { type: 'udp4' })
    this.set('stamp', undefined)
    this.set('timestamp', undefined)
    this.protocol = new Protocol(this.did, this.token)
    this.service = new Service({ serviceTokens })
    this.service.on('request', data => this.emit('request', data))
    this.service.on('response', data => this.emit('response', data))
  }

  public openLANControl(token: string) {
    this.set('token', token)
    this.protocol.miio.setToken(token)
    this.enableLANControl = true
  }

  public toObject(): DeviceInfo {
    return super.toObject() as DeviceInfo
  }

  public async call(
    method: string,
    params: any = [],
    options?: {
      keepAlive?: boolean
      timeout?: number
    },
  ): Promise<any> {
    if (!this.stamp) {
      await this.request(this.protocol.miio.helloPacket, { uuid: 'hello' })
    }
    const uuid = this.uuid()
    const data = JSON.stringify({ id: Number(uuid), method, params })
    return this.request(data, { ...options, uuid }).then(val => val.result)
  }

  public send(data: string | Buffer) {
    if (typeof data === 'string') {
      const stamp = this.stamp! + Math.floor((Date.now() - this.timestamp!) / 1000)
      const packet = this.protocol.miio.encode(data, stamp)
      if (!packet) {
        return Promise.reject(new Error('Token is required to call method'))
      }
      data = packet
    }
    return super.send(data)
  }

  protected onMessage(packet: Buffer) {
    const data = this.protocol.miio.decode(packet)
    if (!data) return
    if (data.stamp > 0) {
      this.set('stamp', data.stamp)
      this.set('timestamp', Date.now())
      this.getWaitingRequest('hello')?.resolve()
    }
    if (!data.decrypted) return
    const message = JSON.parse(data.decrypted)
    const id = String(message.id)
    if ('id' in message && 'result' in message) {
      this.getWaitingRequest(id)?.resolve(message)
    } else if (
      'id' in message
      && 'error' in message
      && 'code' in message.error
      && 'message' in message.error
    ) {
      this.getWaitingRequest(id)?.reject(message.error.message)
    }
  }

  public async setupInfo() {
    this.fill(await this.getInfo())
  }

  public async setupSpec() {
    this.set('spec', await this.getSpec())
  }

  public async setupProps() {
    if (!this.spec) return
    const names: string[] = []
    for (const [name, property] of this.spec.properties.entries()) {
      if (!property.access.includes('read')) continue
      names.push(name)
    }
    const props = await this.getProps(names.map(name => this.spec!.nameIid.get(name)!))
    props.forEach((val: any, index: number) => {
      this.set(names[index], val)
    })
  }

  public getInfo() {
    return this.enableLANControl
      ? this.call('miIO.info')
      : this.service.miio.getDevice(this.did)
  }

  public getSpec() {
    return this.service.miotSpec.find(this.model!)
  }

  protected resovleIid(iid: string) {
    const [siid, piid] = iid
      .replace(/^0\./, '')
      .split('.')
    return { siid: Number(siid), piid: Number(piid) }
  }

  protected parseProp(result: Record<string, any>, throwError = false) {
    if (typeof result === 'object') {
      if ('code' in result) {
        try {
          this.service.miot.catchError(result.code)
        } catch (err) {
          if (throwError) {
            throw err
          }
          return undefined
        }
      }
      return 'value' in result ? result.value : result
    }
    return result
  }

  public getProps(keys: string[], throwError = false) {
    if (this.enableLANControl) {
      if (keys.length && keys[0].includes('.')) {
        return this.call('get_properties', keys.map(iid => {
          const { siid, piid } = this.resovleIid(iid)
          return { did: String(this.did), siid, piid }
        }))
      }
      return this.call('get_prop', keys)
        .then(result => result.map((val: any) => this.parseProp(val, throwError)))
    } else {
      return this.service.miot.getProps(this.did, keys)
        .then(result => result.map((val: any) => this.parseProp(val, throwError)))
    }
  }

  public async getProp(key: string) {
    return await this.getProps([key], true).then(res => res[0])
  }

  public setProps(props: [string, any][]) {
    if (this.enableLANControl) {
      return this.call('set_properties', props.map(val => {
        const { siid, piid } = this.resovleIid(val[0])
        return { did: String(this.did), siid, piid, value: val[1] }
      }))
    } else {
      return this.service.miot.setProps(this.did, props)
    }
  }

  public async setProp(key: string, value: any) {
    if (this.spec?.nameIid.has(key)) {
      key = this.spec.nameIid.get(key)!
    }
    if (key.includes('.')) {
      return this.setProps([[key, value]]).then(res => res[0])
    } else {
      return this.call(`set_${ key }`, [value])
    }
  }

  public action(key: string, args: any[] = []) {
    if (this.spec?.nameIid.has(key)) {
      key = this.spec.nameIid.get(key)!
    }
    if (this.enableLANControl) {
      const { siid, piid } = this.resovleIid(key)
      return this.call('action', {
        did: String(this.did), siid, aiid: piid, in: args,
      })
    } else {
      return this.service.miot.action(this.did, key, args)
    }
  }
}
