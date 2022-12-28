import { MIoTSpecClient } from './MIoTSpecClient'
import type { Instance, InstanceProperties, SpecificationType } from '../types'

export class MIoTSpec extends MIoTSpecClient {
  public async find(name: string) {
    if (!name.startsWith('urn')) {
      const instances = await this.getInstances('released')
      name = instances.find((item: any) => item.model === name)?.type
    }
    return this.findInstance(name)
  }

  public getInstances(status?: 'all' | 'released'): Promise<Record<string, any>[]> {
    return this.request(`/instances?status=${ status ?? '' }`)
      .then(res => res.instances)
  }

  public findInstance(type: string) {
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

  public findService(type: string) {
    return this.request(`/spec/service?type=${ type }`)
  }

  public getProperties() {
    return this.request('/spec/properties')
  }

  public findProperty(type: string) {
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

  /**
   * urn:miot-spec-v2:service:device-information:00007801
   * <URN> ::= "urn:"<namespace>":"<type>":"<name>":"<value>  [":"<vendor-product>":"<version>]
   */
  public parseType(string: string): SpecificationType {
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

  public parseInstanceProperties(instance: Instance): InstanceProperties {
    const map: InstanceProperties = {}
    instance.services.forEach(service => {
      const { name: serviceName } = this.parseType(service.type)
      service.properties.forEach(property => {
        const { name: propertyName } = this.parseType(property.type)
        map[`${ serviceName }.${ propertyName }`] = {
          siid: service.iid,
          ...property,
        }
      })
    })
    return map
  }
}
