import fetch from 'node-fetch'
import { ResponseStatusError } from './utils'
import type { Instance, InstanceProperties, SpecificationType } from './types'
import type { Response } from 'node-fetch'

const httpGet = (url: string): Promise<Record<string, any>> => fetch(
  `https://miot-spec.org/miot-spec-v2/${ url }`,
)
  .then((res: Response) => res.ok ? res : Promise.reject(new ResponseStatusError(res)))
  .then(res => res.json() as any)

export async function findInstance(model: string): Promise<Instance> {
  const { instances } = await httpGet('instances?status=released')
  const type = instances.find((v: any) => v.model === model)!.type
  return (await httpGet(`instance?type=${ type }`)) as Instance
}

/**
 * urn:miot-spec-v2:service:device-information:00007801
 * <URN> ::= "urn:"<namespace>":"<type>":"<name>":"<value>  [":"<vendor-product>":"<version>]
 */
export function parseSpecificationType(string: string): SpecificationType {
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

export function parseInstanceProperties(instance: Instance): InstanceProperties {
  const map: InstanceProperties = {}
  instance.services.forEach(service => {
    const { name: serviceName } = parseSpecificationType(service.type)
    service.properties.forEach(property => {
      const { name: propertyName } = parseSpecificationType(property.type)
      map[`${ serviceName }.${ propertyName }`] = {
        siid: service.iid,
        ...property,
      }
    })
  })
  return map
}