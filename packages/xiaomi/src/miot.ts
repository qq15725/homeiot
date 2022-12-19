import fetch from 'node-fetch'
import { ResponseStatusError } from './utils'
import type { Response } from 'node-fetch'

const httpGet = (url: string): Promise<Record<string, any>> => fetch(`https://miot-spec.org/miot-spec-v2/${ url }`)
  .then((res: Response) => res.ok ? res : Promise.reject(new ResponseStatusError(res)))
  .then(res => res.json() as any)

export interface PropertyValue {
  description: string
  value: number
}

export interface Property {
  access: ('read' | 'write' | 'notify')[]
  description: string
  format: 'bool' | 'uint8' | 'uint16' | 'uint32' | 'int8' | 'int16' | 'int32' | 'int64' | 'float' | 'string' | 'hex'
  iid: number
  type: string
  'value-list'?: PropertyValue[]
  'value-range'?: number[]
  unit?: string
}

export interface Service {
  description: string
  iid: number
  properties: Property[]
  type: string
}

export interface Instance {
  description: string
  services: Service[]
  type: string
}

export async function findInstance(model: string): Promise<Instance> {
  const { instances } = await httpGet('instances?status=released')
  const type = instances.find((v: any) => v.model === model)!.type
  return (await httpGet(`instance?type=${ type }`)) as Instance
}
