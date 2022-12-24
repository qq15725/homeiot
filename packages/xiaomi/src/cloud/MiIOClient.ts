import { createHash, createHmac, randomBytes } from 'node:crypto'
import { stringify } from 'node:querystring'
import { CryptRC4 } from './utils'
import { Client } from './Client'
import { ResponseError } from './errors'
import type { Request } from './types'
import type { RequestInit, Response } from 'node-fetch'

export abstract class MiIOClient extends Client {
  protected sid = 'xiaomiio'
  protected baseUri = 'https://api.io.mi.com/app'
  protected get accessToken() {
    return this.config.accessTokens[this.sid]
  }

  protected getRequestUrl(url: string, context?: Record<string, any>) {
    url = super.getRequestUrl(url, context)
    const { country } = this.config
    return country
      ? url.replace('https://api.io.mi.com', `https://${ country }.api.io.mi.com`)
      : url
  }

  protected getRequestInit(init?: RequestInit, context?: Record<string, any>): RequestInit | undefined {
    const { userId, serviceToken, userAgent, deviceId } = this.accessToken!
    const { locale } = this.app.config
    return super.getRequestInit({
      ...init,
      headers: {
        'User-Agent': userAgent,
        'x-xiaomi-protocal-flag-cli': 'PROTOCAL-HTTP2',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': [
          'sdkVersion=accountsdk-18.8.15',
          `deviceId=${ deviceId }`,
          `userId=${ userId }`,
          `yetAnotherServiceToken=${ serviceToken }`,
          `serviceToken=${ serviceToken }`,
          `locale=${ locale }`,
          'channel=MI_APP_STORE',
        ].join('; '),
        ...init?.headers,
      },
    }, context)
  }

  protected async unwrapResponse(response: Response, request: Request): Promise<any> {
    let data: Record<string, any>
    if (this.config.useEncrypt) {
      data = JSON.parse(request.context!.crypt.decode(await response.text()))
    } else {
      data = await response.json() as Promise<any>
    }
    if (!data.result) {
      throw new ResponseError(JSON.stringify(data), response, request)
    }
    return data.result
  }

  protected generateNonce() {
    const nonce = Buffer.allocUnsafe(12)
    nonce.write(randomBytes(8).toString('hex'), 0, 'hex')
    nonce.writeInt32BE(parseInt(String(Date.now() / 60000), 10), 8)
    return nonce.toString('base64')
  }

  protected signNonce(nonce: string) {
    return createHash('sha256')
      .update(Buffer.from(this.accessToken!.ssecurity, 'base64'))
      .update(Buffer.from(nonce, 'base64'))
      .digest('base64')
  }

  public async request(url: string, data: Record<string, any> = {}): Promise<Record<string, any>> {
    if (!this.accessToken) {
      await this.app.account.login(this.sid)
    }
    const { ssecurity } = this.accessToken!
    const { useEncrypt } = this.app.config
    const params: Record<string, any> = { data: JSON.stringify(data) }
    const nonce = this.generateNonce()
    const signedNonce = this.signNonce(nonce)
    if (useEncrypt) {
      const crypt = new CryptRC4(Buffer.from(signedNonce, 'base64'), 1024)
      function signature(params: Record<string, any>) {
        return createHash('sha1')
          .update([
            'POST', url,
            ...Object.keys(params).sort().map(key => `${ key }=${ params[key] }`),
            signedNonce,
          ].join('&'))
          .digest('base64')
      }
      params.rc4_hash__ = signature(params)
      for (const [key, value] of Object.entries(params)) params[key] = crypt.encode(value)
      params.signature = signature(params)
      params.ssecurity = ssecurity
      params._nonce = nonce
      return super.request(url, {
        method: 'POST',
        headers: {
          'Accept-Encoding': 'identity',
          'MIOT-ENCRYPT-ALGORITHM': 'ENCRYPT-RC4',
        },
        body: stringify(params),
      }, { crypt })
    } else {
      return super.request(url, {
        method: 'POST',
        body: stringify({
          _nonce: nonce,
          data: params.data,
          signature: createHmac('sha256', Buffer.from(signedNonce, 'base64'))
            .update([url, signedNonce, nonce, `data=${ params.data }`].join('&'))
            .digest('base64'),
        }),
      })
    }
  }
}
