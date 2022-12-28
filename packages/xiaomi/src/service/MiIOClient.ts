import { createHash, createHmac, randomBytes } from 'node:crypto'
import { stringify } from 'node:querystring'
import { CryptRC4 } from './utils'
import { Client } from './Client'
import { ResponseError } from './errors'
import type { Request } from './types'
import type { RequestInit, Response } from 'node-fetch'

export abstract class MiIOClient extends Client {
  public readonly sid = 'xiaomiio'
  protected baseUri = 'https://api.io.mi.com/app'
  protected get accessToken() {
    return this.config.serviceTokens[this.sid]
  }

  protected errorCodes = {
    '-705001000': 'generic internal error',
    // '-706012000': 'generic internal error',
    '-705004000': 'generic internal error',
    '-705005000': 'subscriptionId encode error',
    '-705006000': 'notify error',
    // '-704002000': 'generic device error',

    '-702000000': 'OK',
    '-702010000': 'accept',

    '-704010000': 'generic unauthorized',

    '-704002000': 'invalid param',
    '-704000000': 'bad request',
    '-704000001': 'bad request body',
    '-704001000': 'timer only support mi device',

    '-702022036': 'trigger scene processing',
    // '-704042010': 'trigger scene error',
    '-704042009': 'scene not found',
    '-704042012': 'scene no permit',

    // '-702022036': 'get device list processing',
    '-704042010': 'get device list error',
    '-704090001': 'device not found',
    '-704042001': 'device not found',
    '-704042011': 'device offline',

    '-704012901': 'token not exist or expired',
    '-704012902': 'token invalid',
    '-704012903': 'authorized expired',
    '-704012904': 'device unauthorized',
    '-704012905': 'device not bind',
    '-704012906': 'miot oauth failed',

    '-704040002': 'service not found',

    '-706010002': 'remote service error',
    '-706012000': '3rd cloud bad response',
    '-706010004': 'generic miot error',
    '-706010005': 'property cache error',

    '-704040003': 'property not found',
    '-704030013': 'property cannot read',
    '-704030023': 'property cannot write',
    '-704030033': 'property cannot notify',
    '-704030992': 'request too frequent deniedRequest',
    '-704220043': 'invalid property value',

    '-705201013': 'property read error',
    '-706012013': 'property read error',
    '-706012014': 'property read not response',
    '-705201023': 'property write error',
    '-706012023': 'property write error',
    // '-702022036': 'property write processing',
    '-705201033': 'property notify error',
    '-706012033': 'property notify error',
    '-706012043': 'subscribe error',

    '-704040004': 'event not found',
    '-704222034': 'event arguments count mismatch',
    // '-704222034': 'event arguments error',

    '-704040005': 'action not found',
    // '-702022036': 'action execute processing',
    '-705201015': 'action execute error',
    '-706012015': 'action execute error',
    '-704220035': 'action arguments error',
    '-704220025': 'action arguments count mismatch',
    '-704222035': 'action results count mismatch',
    // '-704222035': 'action results error',

    '-704044006': 'spec not fount',
    '-705204006': 'invalid specification',
    '-705204007': 'instance not loaded',

    '-704041007': 'cloud not fount',

    '-704220008': 'invalid id',
    '-704220009': 'invalid UDID',
    '-704220010': 'invalid subscriptionId',

    '-704053100': 'Unable to perform this operation',
    '-704083036': 'operation timeout',
    '-704040999': 'not implemented',
    '-704013101': 'ir device not support operation',
    '-704053101': 'camera device sleeping',
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
    const { code, message, result } = data
    if (code) {
      throw new ResponseError(`Response error ${ code } ${ message }`, response, request)
    }
    if (!result) {
      throw new ResponseError(`Response error ${ JSON.stringify(data) }`, response, request)
    }
    return result
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

  protected catchError(code?: number) {
    if (code === undefined) return
    const errorCode = code.toString()
    if (errorCode in this.errorCodes) {
      throw new Error((this.errorCodes as any)[errorCode])
    }
  }
}
