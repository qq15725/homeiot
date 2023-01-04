import { MIoTSpecClient } from './MIoTSpecClient'
import type { MIoTSpecInstance, MIoTSpecProperty, MIoTSpecService, MIoTSpecType } from './types'

export class MIoTSpec extends MIoTSpecClient {
  public async find(name: string): Promise<MIoTSpecInstance> {
    if (!name.startsWith('urn')) {
      const instances = await this.getInstances('released')
      const type = instances.find((item: any) => item.model === name)?.type
      if (type) {
        name = type
      }
    }
    return this.findInstance(name)
  }

  public getInstances(status?: 'all' | 'released'): Promise<MIoTSpecInstance[]> {
    return this.request(`/instances?status=${ status ?? '' }`)
      .then(res => res.instances)
  }

  public findInstance(type: string): Promise<MIoTSpecInstance> {
    return this.request(`/instance?type=${ type }`)
  }

  public getDevices() {
    return this.request('/spec/devices')
  }

  public findDevice(type: string) {
    return this.request(`/spec/device?type=${ type }`)
  }

  public getServices() {
    return this.request('/spec/services')
  }

  public findService(type: string): Promise<MIoTSpecService> {
    return this.request(`/spec/service?type=${ type }`)
  }

  public getProperties() {
    return this.request('/spec/properties')
  }

  public findProperty(type: string): Promise<MIoTSpecProperty> {
    return this.request(`/spec/property?type=${ type }`)
  }

  public getActions() {
    return this.request('/spec/actions')
  }

  public findAction(type: string) {
    return this.request(`/spec/action?type=${ type }`)
  }

  public getEvents() {
    return this.request('/spec/events')
  }

  public findEvent(type: string) {
    return this.request(`/spec/event?type=${ type }`)
  }

  public parseType(string: string): MIoTSpecType {
    const [urn, namespace, type, name, value, vendorProduct, version] = string.split(':')
    return {
      urn,
      namespace,
      type,
      name,
      value: parseInt(value, 16),
      vendorProduct,
      version: version ? Number(version) : undefined,
    } as any
  }
}
