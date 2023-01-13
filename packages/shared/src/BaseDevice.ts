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

export type BaseDeviceEvents = {
  error: (error: Error) => void
  start: () => void
  stop: () => void
  request: (data: string | Uint8Array, uuid: string) => void
  response: (data: any, uuid: string) => void
}

export interface BaseDeviceOptions {
  type: 'tcp' | 'udp4' | 'udp6'
  retries: number
  encoding: BufferEncoding
  connectionTimeout: number
  requestTimeout: number
  tcpOptions: TcpOptions
  udpOptions: UdpOptions
}

export abstract class BaseDevice extends EventEmitter {
  private static _autoIncrementId = 0
  private _client?: Tcp | Udp
  private readonly _waitingRequests = new Map<string, WaitingRequest>()
  private readonly _attributes = new Map<string, any>()
  private readonly _options: BaseDeviceOptions

  constructor(
    public readonly host: string,
    public readonly port: number,
    attributes?: Record<string, any>,
    options?: Partial<BaseDeviceOptions>,
  ) {
    super()

    const {
      type = 'tcp',
      retries = 1,
      connectionTimeout = 3000,
      requestTimeout = 3000,
      encoding = 'utf8',
      tcpOptions = {},
      udpOptions = {
        type: options?.type?.startsWith('udp')
          ? (options.type as 'udp4' | 'udp6')
          : 'udp4',
        reuseAddr: true,
      },
    } = options || {}

    this._options = {
      type,
      retries,
      connectionTimeout,
      requestTimeout,
      encoding,
      tcpOptions,
      udpOptions,
    }

    attributes && this.fill(attributes)
  }

  public get(key: string): any | undefined {
    return this._attributes.get(key)
  }

  public has(key: string): boolean {
    return this._attributes.has(key)
  }

  public set(key: string, value: any): void {
    this._attributes.set(key, value)
  }

  public fill(attributes: Record<string, any>): void {
    for (const [key, value] of Object.entries(attributes)) {
      this._attributes.set(key, value)
    }
  }

  public toObject(): Record<string, any> {
    return {
      ...Object.fromEntries(this._attributes),
      host: this.host,
      port: this.port,
    }
  }

  public start(
    options?: {
      timeout?: number
    },
  ): Promise<this> {
    return new Promise(resolve => {
      const timeout = options?.timeout ?? this._options.connectionTimeout
      const { type, encoding, tcpOptions, udpOptions } = this._options

      if (this._client instanceof Udp) {
        return resolve(this)
      } else if (this._client instanceof Tcp) {
        const waitForConnect = (counts: number) => {
          this._client instanceof Tcp
          && this._client.connecting
          && counts
            ? sleep(100).then(() => waitForConnect(--counts))
            : resolve(this)
        }
        return waitForConnect(30)
      }

      const onConnectionTimeout = () => {
        if (this._client instanceof Tcp) {
          this._client?.destroy(new Error('Socket connect timeout'))
        }
      }
      const onConnectionError = (err: Error) => {
        this._client = undefined
        this.onError(err)
      }
      const onError = this.onError.bind(this)
      const onStart = this.onStart.bind(this)
      const onStop = this.onStop.bind(this)
      const onMessage = this.onMessage.bind(this)

      if (type === 'tcp') {
        this._client = new Tcp(tcpOptions)
          .setTimeout(timeout)
          .once('timeout', onConnectionTimeout)
          .once('error', onConnectionError)
          .once('connect', () => {
            onStart()
            ;(this._client as Tcp)
              .off('timeout', onConnectionTimeout)
              .off('error', onConnectionError)
              .setEncoding(encoding)
              .once('close', onStop)
              .on('error', onError)
              .on('data', onMessage)
            resolve(this)
          })
          .connect(this.port, this.host)
      } else if (type.startsWith('udp')) {
        this._client = createUdp(udpOptions)
          .once('error', onConnectionError)
          .once('listening', () => {
            onStart()
            ;(this._client as Udp)
              .off('error', onConnectionError)
              .once('close', onStop)
              .on('error', onError)
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
          onCallback(new Error(`${ this._options.type } socket is closed`))
        } else if (this._client instanceof Udp) {
          this._client.send(data, 0, data.length, this.port, this.host, onCallback)
        } else {
          this._client.write(data, onCallback)
        }
      })
    })
  }

  public uuid = (): string => String(++BaseDevice._autoIncrementId)

  public request(
    data: string | Uint8Array,
    options?: {
      uuid?: string
      keepAlive?: boolean
      timeout?: number
    },
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const {
        uuid = this.uuid(),
        timeout = this._options.requestTimeout,
      } = options ?? {}
      let timer: any

      this.onRequest(uuid, data)

      const onFinally = () => {
        this._waitingRequests.delete(uuid)
        timer && clearTimeout(timer)
        !options?.keepAlive && this.stop()
      }

      const onResolve = (res: any) => {
        this.onResponse(uuid, res)
        resolve(res)
        onFinally()
      }

      const onReject = (err: any) => {
        reject(err)
        onFinally()
      }

      timer = setTimeout(() => onReject(new Error(`Request timeout ${ uuid } ${ data.toString() }`)), timeout)

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
  protected onStart() {
    this.emit('start')
  }

  // overrideable
  protected onStop() {
    this._client = undefined
    this.emit('stop')
  }

  // overrideable
  protected onRequest(uuid: string, data: string | Uint8Array) {
    this.emit('request', data, uuid)
  }

  // overrideable
  protected onResponse(uuid: string, data: any) {
    this.emit('response', data, uuid)
  }

  // overrideable
  protected onMessage(_message: Buffer) {}
}
