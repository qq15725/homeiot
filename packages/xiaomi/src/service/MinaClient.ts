import { stringify } from 'node:querystring'
import { Client } from './Client'
import { randomString } from './utils'
import type { RequestInit } from 'node-fetch'

export abstract class MinaClient extends Client {
  public readonly sid = 'micoapi'
  protected baseUri = 'https://api2.mina.mi.com'
  protected get accessToken() {
    return this.config.serviceTokens[this.sid]
  }

  protected getRequestInit(init?: RequestInit, context?: Record<string, any>): RequestInit | undefined {
    const { userId, serviceToken, userAgent } = this.accessToken!
    return super.getRequestInit({
      ...init,
      headers: {
        'User-Agent': userAgent,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': [
          `userId=${ userId }`,
          `serviceToken=${ serviceToken }`,
        ].join('; '),
        ...init?.headers,
      },
    }, context)
  }

  public async request(url: string, data?: Record<string, any>, context?: Record<string, any>): Promise<Record<string, any>> {
    if (!this.accessToken) {
      await this.app.account.login(this.sid)
    }
    const requestId = `app_ios_${ randomString(30) }`
    if (data) {
      data.requestId = requestId
    } else {
      url = `${ url }&requestId=${ requestId }`
    }
    return super.request(
      url,
      data
        ? {
            method: 'POST',
            body: stringify(data),
          }
        : undefined,
      context,
    )
  }
}
