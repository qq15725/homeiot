import fetch from 'node-fetch'
import { ResponseError } from './errors'
import type { Request } from './types'
import type { Cloud } from './Cloud'
import type { RequestInit, Response } from 'node-fetch'

export abstract class Client {
  protected baseUri?: string

  protected get config() {
    return this.app.config
  }

  protected get log() {
    return this.config.log
  }

  constructor(
    protected app: Cloud,
  ) {
    //
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
    this.log?.debug('request', request)
    const response = await fetch(request.url, request.init)
    if (!response.ok) {
      this.log?.debug('response', await response.text())
      throw new ResponseError(
        `Response status error ${ response.status } ${ response.statusText }`,
        response,
        request,
      )
    }
    const result = await this.unwrapResponse(response, request)
    this.log?.debug('response', result)
    return result
  }
}
