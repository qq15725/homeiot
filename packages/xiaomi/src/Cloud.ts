import { createHash, createHmac, randomBytes } from 'node:crypto'
import { stringify } from 'node:querystring'
import fetch from 'node-fetch'
import { CryptRC4, ResponseStatusError, randomString } from './utils'
import type { CloudOptions } from './types'
import type { Response } from 'node-fetch'

export class Cloud {
  protected useEncryptRequest = true
  protected readonly userAgent = `Android-7.1.1-1.0.0-ONEPLUS A3010-136-${ randomString(13, 'ABCDEF') } APP/xiaomi.smarthome APPV/62830`

  // account.xiaomi.com
  protected authBaseURL = 'https://account.xiaomi.com/pass'
  protected readonly username: string
  protected readonly password: string
  protected ssecurity?: string
  protected userId?: string
  protected serviceToken?: string

  // api.io.mi.com
  protected baseURL = 'https://api.io.mi.com/app'
  protected locale: string

  protected middlewares = {
    status: (res: Response) => res.ok ? res : Promise.reject(new ResponseStatusError(res)),
    jsonInLogin: (res: Response) => res.text()
      .then(res => res.replace(/^&&&START&&&/, ''))
      .then(text => {
        try {
          return JSON.parse(text)
        } catch (err) {
          return Promise.reject(err)
        }
      }),
  }

  constructor(options: CloudOptions) {
    this.username = String(options.username)
    this.password = String(options.password)
    this.locale = options.locale ?? 'en'
    if (options.country) this.baseURL = `https://${ options.country }.api.io.mi.com/app`
  }

  public login(): Promise<{ ssecurity: string; userId: string; serviceToken: string }> {
    if (this.serviceToken) return Promise.resolve({
      ssecurity: this.ssecurity!,
      userId: this.userId!,
      serviceToken: this.serviceToken,
    })

    return fetch(`${ this.authBaseURL }/serviceLogin?sid=xiaomiio&_json=true`)
      .then(this.middlewares.status)
      .then(this.middlewares.jsonInLogin)
      .then(data => data._sign || Promise.reject(new Error(`Login step 1 failed. response: ${ JSON.stringify(data) }`)))
      .then(_sign => {
        return fetch(`${ this.authBaseURL }/serviceLoginAuth2 `, {
          method: 'POST',
          body: stringify({
            hash: createHash('md5').update(this.password).digest('hex').toUpperCase(),
            _json: 'true',
            sid: 'xiaomiio',
            callback: 'https://sts.api.io.mi.com/sts',
            qs: '%3Fsid%3Dxiaomiio%26_json%3Dtrue',
            _sign,
            user: this.username,
          }),
          headers: {
            'User-Agent': this.userAgent,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
          .then(this.middlewares.status)
          .then(this.middlewares.jsonInLogin)
          .then(data => {
            if (!data.ssecurity || !data.userId || !data.location) {
              return Promise.reject(new Error(`Login step 2 failed. response: ${ JSON.stringify(data) }`))
            }
            if (data.notificationUrl) {
              return Promise.reject(new Error(`Two factor authentication required, please visit the following url and retry login: ${ data.notificationUrl }`))
            }
            return data
          })
          .then(({ ssecurity, userId, location }) => {
            return fetch(location)
              .then(this.middlewares.status)
              .then(res => res.headers.raw())
              .then(headers => headers['set-cookie'])
              .then(cookies => {
                for (const cookieStr of cookies) {
                  const cookie = cookieStr.split('; ')[0]
                  const idx = cookie.indexOf('=')
                  if (cookie.substring(0, idx) === 'serviceToken') {
                    this.ssecurity = ssecurity
                    this.userId = userId
                    this.serviceToken = cookie.substring(idx + 1, cookie.length).trim()
                    return {
                      ssecurity,
                      userId,
                      serviceToken: this.serviceToken,
                    }
                  }
                }
                return Promise.reject(new Error(`Login step 3 failed. cookies: ${ JSON.stringify(cookies) }`))
              })
          })
      })
  }

  public request(path: string, data: Record<string, any>): Promise<Record<string, any>> {
    return this.login()
      .then(({ userId, serviceToken, ssecurity }) => {
        const url = `${ this.baseURL }${ path }`
        const params: Record<string, any> = { data: JSON.stringify(data) }
        // Nonce
        const nonceBuffer = Buffer.allocUnsafe(12)
        nonceBuffer.write(randomBytes(8).toString('hex'), 0, 'hex')
        nonceBuffer.writeInt32BE(parseInt(String(Date.now() / 60000), 10), 8)
        const nonce = nonceBuffer.toString('base64')
        // Signed nonce
        const signedNonce = createHash('sha256')
          .update(Buffer.from(ssecurity, 'base64'))
          .update(Buffer.from(nonce, 'base64'))
          .digest('base64')
        const headers = {
          'User-Agent': this.userAgent,
          'x-xiaomi-protocal-flag-cli': 'PROTOCAL-HTTP2',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': [
            `userId=${ userId }`,
            `yetAnotherServiceToken=${ serviceToken }`,
            `serviceToken=${ serviceToken }`,
            `locale=${ this.locale }`,
            'channel=MI_APP_STORE',
          ].join('; '),
        }
        if (this.useEncryptRequest) {
          const crypt = new CryptRC4(Buffer.from(signedNonce, 'base64'), 1024)
          function generateSignature(params: Record<string, any>) {
            return createHash('sha1')
              .update([
                'POST',
                url.split('com')[1].replace('/app/', '/'),
                ...Object.keys(params).sort().map(key => `${ key }=${ params[key] }`),
                signedNonce,
              ].join('&'))
              .digest('base64')
          }
          params.rc4_hash__ = generateSignature(params)
          for (const [key, value] of Object.entries(params)) params[key] = crypt.encode(value)
          params.signature = generateSignature(params)
          params.ssecurity = ssecurity
          params._nonce = nonce
          return fetch(url, {
            method: 'POST',
            headers: {
              ...headers,
              'Accept-Encoding': 'identity',
              'MIOT-ENCRYPT-ALGORITHM': 'ENCRYPT-RC4',
            },
            body: stringify(params),
          })
            .then(this.middlewares.status)
            .then(res => res.text())
            .then(text => crypt.decode(text))
            .then(text => JSON.parse(text))
        } else {
          return fetch(url, {
            method: 'POST',
            headers,
            body: stringify({
              _nonce: nonce,
              data: params.data,
              signature: createHmac('sha256', Buffer.from(signedNonce, 'base64'))
                .update([
                  path, signedNonce, nonce,
                  ...Object.keys(params).sort().map(key => `${ key }=${ params[key] }`),
                ].join('&'))
                .digest('base64'),
            }),
          })
            .then(this.middlewares.status)
            .then(res => res.json())
        }
      })
      .then(data => {
        if (data && !data.result) {
          return Promise.reject(new Error(`No result in response! Message: ${ data.message ?? '-' }`))
        }
        return data.result
      })
  }

  public call(deviceId: string, method: string, params: Record<string, any>) {
    return this.request(`/home/rpc/${ deviceId }`, { method, params })
  }

  public getDevices(
    options?: {
      getVirtualModel?: boolean
      getHuamiDevices?: 0 | 1
      get_split_device?: boolean
      support_smart_home?: boolean
      dids?: string[]
    },
  ): Promise<Record<string, any>[]> {
    return this.request('/home/device_list', {
      getVirtualModel: true,
      getHuamiDevices: 1,
      get_split_device: false,
      support_smart_home: true,
      ...options,
    }).then(result => result.list)
  }

  public getHomes(options?: { fetch_share_dev?: boolean }): Promise<Record<string, any>[]> {
    return this.request('/homeroom/gethome', {
      fetch_share_dev: false,
      ...options,
    }).then(result => result.homelist)
  }

  // miot

  public setProps(params: Record<string, any>) {
    return this.request('/miotspec/prop/set', { params })
  }

  public getProps(params: Record<string, any>) {
    return this.request('/miotspec/prop/get', { params })
  }

  public action(params: Record<string, any>) {
    return this.request('/miotspec/action', { params })
  }
}
