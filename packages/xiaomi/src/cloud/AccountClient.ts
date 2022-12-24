import { Client } from './Client'
import type { RequestInit, Response } from 'node-fetch'

export abstract class AccountClient extends Client {
  protected baseUri = 'https://account.xiaomi.com/pass'

  protected getRequestInit(init?: RequestInit, context?: Record<string, any>): RequestInit | undefined {
    const accessToken = this.config.accessTokens[context?.sid]
    return super.getRequestInit({
      ...init,
      headers: {
        'User-Agent': accessToken?.userAgent ?? this.config.userAgent,
        'Cookie': [
          'sdkVersion=accountsdk-18.8.15',
          `deviceId=${ accessToken?.deviceId ?? this.config.deviceId }`,
          `userId=${ accessToken?.userId ?? '' }`,
          `passToken=${ accessToken?.passToken ?? '' }`,
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
