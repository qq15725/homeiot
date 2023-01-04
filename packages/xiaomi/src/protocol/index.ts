import { MiIO } from './MiIO'

export class Protocol {
  public miio = new MiIO()

  constructor(did?: number, token?: string) {
    this.miio.did = did
    token && this.miio.setToken(token)
  }
}

export * from './types'
