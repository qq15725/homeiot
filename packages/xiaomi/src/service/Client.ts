import fetch from 'node-fetch'
import { EventEmitter } from '@homeiot/shared'
import { ResponseError } from './errors'
import type { Request } from './types'
import type { Service } from './index'
import type { RequestInit, Response } from 'node-fetch'

export abstract class Client extends EventEmitter {
  protected baseUri?: string

  protected get config() {
    return this.app.config
  }

  constructor(
    protected app: Service,
  ) {
    super()
  }

  protected getRequestUrl(url: string, _context?: Record<string, any>): string {
    return this.baseUri
      ? `${ this.baseUri }/${ url.replace(/^\//, '') }`
      : url
  }

  protected getRequestInit(init?: RequestInit, _context?: Record<string, any>): RequestInit | undefined {
    return {
      ...init,
      headers: {
        'User-Agent': this.config.userAgent,
        ...init?.headers,
      },
    }
  }

  protected unwrapResponse(response: Response, _request: Request): any {
    return response
  }

  protected async request(url: string, init?: RequestInit, context?: Record<string, any>): Promise<any> {
    const request = { url, init, context }
    request.url = this.getRequestUrl(url, context)
    request.init = this.getRequestInit(init, context)
    this.emit('request', request)
    this.app.emit('request', request)
    const response = await fetch(request.url, request.init)
    if (!response.ok) {
      const result = await response.text()
      this.emit('response', result)
      this.app.emit('response', result)
      throw new ResponseError(
        `Response status error ${ response.status } ${ response.statusText }`,
        response,
        request,
      )
    }
    const result = await this.unwrapResponse(response, request)
    this.emit('response', result)
    this.app.emit('response', result)
    return result
  }
}
