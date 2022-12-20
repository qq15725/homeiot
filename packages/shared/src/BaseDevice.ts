import { Socket as Udp, createSocket as createUdp } from 'node:dgram'
import { Socket as Tcp } from 'node:net'
import { EventEmitter } from './EventEmitter'
import type { SocketOptions as UdpOptions } from 'node:dgram'
import type { SocketConstructorOpts as TcpOptions } from 'node:net'

export interface WaitingRequest {
  resolve: any
  reject: any
}

export abstract class BaseDevice extends EventEmitter {
  private static _autoIncrementId = 0
  private _client?: Tcp | Udp
  private readonly _waitingRequests = new Map<string, WaitingRequest>()
  private _attributes = new Map<string, any>()

  constructor(
    public readonly host: string,
    public readonly port: number,
    private readonly _options?: {
      type?: 'tcp' | 'udp4' | 'udp6'
      encoding?: BufferEncoding
      connectTimeout?: number
      timeout?: number
      tcpOptions?: TcpOptions
      udpOptions?: UdpOptions
    },
  ) {
    super()
  }

  public getAttribute = (key: string): any | undefined => this._attributes.get(key)
  public hasAttribute = (key: string): boolean => this._attributes.has(key)
  public setAttribute = (key: string, value: any): void => { this._attributes.set(key, value) }
  public getAttributes = (): Record<string, any> => ({ ...Object.fromEntries(this._attributes), host: this.host, port: this.port })
  public setAttributes = (attributes: Record<string, any>): void => { this._attributes = new Map(Object.entries(attributes)) }

  public connect(): Promise<this> {
    const {
      type = 'tcp',
      connectTimeout = 3000,
      timeout = 3000,
      encoding = 'utf8',
      tcpOptions,
      udpOptions,
    } = this._options ?? {}

    if (this._client instanceof Udp) {
      return Promise.resolve(this)
    } else if (this._client instanceof Tcp) {
      let counts = 30
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
      const waitForConnect = (): Promise<this> => {
        if (this._client instanceof Tcp && this._client.connecting && --counts) return sleep(100).then(waitForConnect)
        if (counts <= 0) return Promise.reject(new Error('Socket connect timeout'))
        return Promise.resolve(this)
      }
      return Promise.resolve().then(waitForConnect)
    }

    return new Promise((resolve, reject) => {
      const onConnectTimeout = () => this._client instanceof Tcp && this._client?.destroy(new Error('Socket connect timeout'))
      const onConnectError = reject
      const onError = (err: Error) => this.emit('error', err)
      const onClose = () => this._client = undefined
      const onMessage = this.onMessage.bind(this)
      if (type === 'tcp') {
        this._client = new Tcp(tcpOptions)
          .setTimeout(connectTimeout)
          .once('timeout', onConnectTimeout)
          .once('error', onConnectError)
          .once('connect', () => {
            this.emit('connect')
            ;(this._client as Tcp)
              .off('timeout', onConnectTimeout)
              .off('error', onConnectError)
              .setEncoding(encoding)
              .setTimeout(timeout)
              .on('error', onError)
              .once('close', onClose)
              .on('data', onMessage)
            resolve(this)
          })
          .connect(this.port, this.host)
      } else if (type.startsWith('udp')) {
        this._client = createUdp({ type, reuseAddr: true, ...udpOptions })
          .on('listening', () => {
            this.emit('listening')
            ;(this._client as Udp)
              .on('error', onError)
              .on('close', onClose)
              .on('message', onMessage)
            resolve(this)
          })
          .on('connect', () => this.emit('connect'))
          .bind()
      }
    })
  }

  public deconnect() {
    if (this._client instanceof Udp) {
      this._client.close()
    } else if (this._client instanceof Tcp) {
      this._client.destroy()
    }
  }

  public send(data: string | Uint8Array): Promise<void> {
    return this.connect().then(() => {
      return new Promise((resolve, reject) => {
        const onError = (err?: Error | null) => err ? reject(err) : resolve()
        if (!this._client) {
          onError(new Error('Socket is closed'))
        } else if (this._client instanceof Udp) {
          this._client.send(data, 0, data.length, this.port, this.host, onError)
        } else if (this._client instanceof Tcp) {
          this._client.write(data, onError)
        }
      })
    })
  }

  public generateId = (): number => ++BaseDevice._autoIncrementId

  public request(uuid: string, data: string | Uint8Array, options?: { deconnect: boolean }): Promise<any> {
    this.emit('request', data, uuid)

    let timer: any

    const clear = () => {
      this._waitingRequests.delete(uuid)
      timer && clearTimeout(timer)
    }

    return new Promise((resolve, reject) => {
      const onResolve = (res: any) => {
        clear()
        this.emit('response', res, uuid)
        resolve(res)
        options?.deconnect && this.deconnect()
      }

      const onReject = (err: any) => {
        clear()
        reject(err)
        options?.deconnect && this.deconnect()
      }

      timer = setTimeout(() => onReject(new Error(`Request timeout ${ uuid }`)), 500)

      this._waitingRequests.set(uuid, {
        resolve: onResolve,
        reject: onReject,
      })

      this.send(data).catch(onReject)
    })
  }

  public getWaitingRequest = (uuid: string): WaitingRequest | undefined => this._waitingRequests.get(uuid)

  protected onMessage(_message: Buffer) {}
}
