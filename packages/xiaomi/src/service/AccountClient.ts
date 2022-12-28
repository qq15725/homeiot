import { Client } from './Client'
import type { RequestInit, Response } from 'node-fetch'

export abstract class AccountClient extends Client {
  protected baseUri = 'https://account.xiaomi.com/pass'

  protected getRequestInit(init?: RequestInit, context?: Record<string, any>): RequestInit | undefined {
    const token = this.config.serviceTokens[context?.sid]
    return super.getRequestInit({
      ...init,
      headers: {
        'User-Agent': token?.userAgent ?? this.config.userAgent,
        'Cookie': [
          'sdkVersion=accountsdk-18.8.15',
          `deviceId=${ token?.deviceId ?? this.config.deviceId }`,
          `userId=${ token?.userId ?? '' }`,
          `passToken=${ token?.passToken ?? '' }`,
        ].join('; '),
        ...init?.headers,
      },
    }, context)
  }

  protected unwrapResponse(response: Response) {
    return response.text()
      .then(response => response.replace(/^&&&START&&&/, ''))
      .then(text => JSON.parse(text))
  }
}
