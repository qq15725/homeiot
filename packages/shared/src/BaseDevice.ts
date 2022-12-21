import { Socket as Udp, createSocket as createUdp } from 'node:dgram'
import { Socket as Tcp } from 'node:net'
import { EventEmitter } from './EventEmitter'
import { sleep } from './utils'
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

  public start(): Promise<this> {
    return new Promise(resolve => {
      const {
        type = 'tcp',
        connectTimeout = 3000,
        timeout = 3000,
        encoding = 'utf8',
        tcpOptions,
        udpOptions,
      } = this._options ?? {}

      if (this._client instanceof Udp) {
        return resolve(this)
      } else if (this._client instanceof Tcp) {
        const waitForConnect = (counts: number): Promise<this> => {
          return this._client instanceof Tcp
          && this._client.connecting
          && counts
            ? sleep(100).then(() => waitForConnect(--counts))
            : Promise.resolve(this)
        }
        return waitForConnect(30)
      }

      const onConnectTimeout = () => this._client instanceof Tcp && this._client?.destroy(new Error('Socket connect timeout'))
      const onError = this.onError.bind(this)
      const onClose = this.onClose.bind(this)
      const onConnect = this.onConnect.bind(this)
      const onMessage = this.onMessage.bind(this)

      if (type === 'tcp') {
        this._client = new Tcp(tcpOptions)
          .setTimeout(connectTimeout)
          .once('timeout', onConnectTimeout)
          .on('error', onError)
          .once('connect', () => {
            onConnect()
            ;(this._client as Tcp)
              .off('timeout', onConnectTimeout)
              .setEncoding(encoding)
              .setTimeout(timeout)
              .once('close', onClose)
              .on('data', onMessage)
            resolve(this)
          })
          .connect(this.port, this.host)
      } else if (type.startsWith('udp')) {
        this._client = createUdp({ type, reuseAddr: true, ...udpOptions })
          .on('error', onError)
          .once('connect', onConnect)
          .once('listening', () => {
            this.emit('listening')
            ;(this._client as Udp)
              .once('close', onClose)
              .on('message', onMessage)
            resolve(this)
          })
          .bind()
      }
    })
  }

  public stop(): Promise<this> {
    return new Promise(resolve => {
      if (this._client instanceof Udp) {
        this._client.close(() => resolve(this))
      } else if (this._client instanceof Tcp) {
        this._client.destroy()
        resolve(this)
      } else {
        resolve(this)
      }
    })
  }

  public send(data: string | Uint8Array): Promise<this> {
    return this.start().then(() => {
      return new Promise((resolve, reject) => {
        const onCallback = (err?: Error | null) => err ? reject(err) : resolve(this)
        if (!this._client) {
          onCallback(new Error('Socket is closed'))
        } else if (this._client instanceof Udp) {
          this._client.send(data, 0, data.length, this.port, this.host, onCallback)
        } else if (this._client instanceof Tcp) {
          this._client.write(data, onCallback)
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
        options?.deconnect && this.stop()
      }

      const onReject = (err: any) => {
        clear()
        reject(err)
        options?.deconnect && this.stop()
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

  // overrideable
  protected onError(err: Error) {
    this.emit('error', err)
  }

  // overrideable
  protected onClose() {
    this._client = undefined
  }

  // overrideable
  protected onConnect() {
    this.emit('connect')
  }

  // overrideable
  protected onMessage(_message: Buffer) {}
}
