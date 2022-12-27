import { stringify } from 'node:querystring'
import { createHash } from 'node:crypto'
import fetch from 'node-fetch'
import { AccountClient } from './AccountClient'

export class Account extends AccountClient {
  protected serviceLogin(sid: string) {
    return this.request(
      `/serviceLogin?sid=${ sid }&_json=true`,
      undefined,
      { sid },
    )
  }

  protected serviceLoginAuth2(serviceLoginResult: Record<string, any>) {
    const { sid, callback, qs, _sign } = serviceLoginResult
    const { username: user, password } = this.config
    const hash = createHash('md5')
      .update(password!)
      .digest('hex')
      .toUpperCase()
    return this.request('/serviceLoginAuth2', {
      method: 'POST',
      body: stringify({ _json: 'true', qs, sid, _sign, callback, user, hash }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }, { sid })
  }

  protected async getServiceToken(serviceLoginResult: Record<string, any>, needClientSign = false) {
    const { location, nonce, ssecurity } = serviceLoginResult
    const url = needClientSign
      ? `${ location }&clientSign=${ encodeURIComponent(
      Buffer.from(
        createHash('sha1')
          .update(`nonce=${ nonce }&${ ssecurity }`)
          .digest('hex'),
      ).toString('base64'),
    ) }`
      : location
    const res = await fetch(url, {
      headers: {
        'User-Agent': this.config.userAgent,
      },
    })
    if (res.ok) {
      return res.headers.get('set-cookie')
        ?.split('; ')
        .map(v => {
          const arr = v.split(', ')
          return arr[arr.length - 1]
        })
        .find(key => key.startsWith('serviceToken='))
        ?.replace(/^serviceToken=/, '')
    }
    return undefined
  }

  public async login(sid: string) {
    let res = await this.serviceLogin(sid)
    if (res.code !== 0) {
      res = await this.serviceLoginAuth2(res)
    }
    if (res.code !== 0) {
      throw new Error(`Login failed ${ res.code } ${ res.description }`)
    }
    if (res.notificationUrl) {
      throw new Error(`Two factor authentication required, please visit the following url and retry login: ${ res.notificationUrl }`)
    }
    const serviceToken = await this.getServiceToken(res, sid === 'micoapi')
    if (!serviceToken) {
      throw new Error('Login failed missing serviceToken')
    }
    const { userAgent, deviceId } = this.config
    this.config.serviceTokens[sid] = {
      ...res,
      serviceToken,
      userAgent,
      deviceId,
    }
    this.app.emit('serviceToken', this.config.serviceTokens[sid], sid)
  }
}
