import { Client } from './Client'
import type { Response } from 'node-fetch'

export abstract class MIoTSpecClient extends Client {
  protected baseUri = 'https://miot-spec.org/miot-spec-v2'

  protected unwrapResponse(response: Response): any {
    return response.json()
  }
}
