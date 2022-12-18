import { createSocket as createUdpSocket } from 'node:dgram'
import { Socket as TcpSocket } from 'node:net'
import { EventEmitter } from './EventEmitter'
import type { SocketConstructorOpts } from 'node:net'
import type { Socket as UdpSocket } from 'node:dgram'

export abstract class BaseDevice extends EventEmitter {
  private readonly _promises = new Map<string | number, { timeout: any; resolve: any; reject: any }>()
  private _socket?: TcpSocket | UdpSocket

  constructor(
    public readonly host: string,
    public readonly port: number,
    private readonly _options?: {
      type?: 'tcp' | 'udp4' | 'udp6'
      encoding?: BufferEncoding
      timeout?: number
    } & SocketConstructorOpts,
  ) {
    super()
  }

  private _isTcpSocket(socket: any): socket is TcpSocket {
    return (this._options?.type ?? 'tcp') === 'tcp' && Boolean(this._socket)
  }

  private _isUdpSocket(socket: any): socket is UdpSocket {
    return !this._isTcpSocket(this._socket) && Boolean(this._socket)
  }

  protected setPromose(id: string | number, resolve: any, reject: any) {
    this._promises.set(id, {
      timeout: setTimeout(() => {
        reject(new Error(`failed to send message ${ id }.`))
        this._promises.delete(id)
      }, 500),
      resolve,
      reject,
    })
    return this
  }

  protected pullPromise(id: string | number) {
    const promise = this._promises.get(id)
    if (promise) {
      this._promises.delete(id)
      clearTimeout(promise.timeout)
    }
    return promise
  }

  protected async waitForConnect() {
    let tryCounts = 0
    // eslint-disable-next-line no-unmodified-loop-condition
    while (this._isTcpSocket(this._socket) && this._socket.connecting && ++tryCounts < 30) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    if (tryCounts >= 30) {
      return Promise.reject(new Error('Socket connect timeout'))
    }
    return this
  }

  public connect(): Promise<this> {
    return new Promise((resolve, reject) => {
      const socketRaw = this._socket
      const type = this._options?.type ?? 'tcp'
      if (type === 'tcp') {
        if (this._isTcpSocket(socketRaw)) {
          return this.waitForConnect().then(resolve).catch(reject)
        }
        const socket = new TcpSocket(this._options)
        const onConnectTimeout = () => socket.destroy(new Error('Socket connect timeout'))
        const onConnectError = reject
        this._socket = socket
          .connect(this.port, this.host)
          .setTimeout(3000)
          .once('timeout', onConnectTimeout)
          .once('error', onConnectError)
          .once('close', () => this._socket = undefined)
          .once('connect', () => {
            socket
              .off('timeout', onConnectTimeout)
              .off('error', onConnectError)
              .setEncoding(this._options?.encoding ?? 'utf8')
              .setTimeout(this._options?.timeout ?? 3000)
              .on('error', err => this.emit('error', err))
              .on('close', () => this._socket = undefined)
              .on('data', this.onMessage.bind(this))
            this.emit('connected')
            resolve(this)
          }) as any
      } else {
        if (this._isUdpSocket(socketRaw)) {
          return resolve(this)
        }
        this._socket = createUdpSocket({
          type,
          reuseAddr: true,
        })
          .bind(this.port)
          .once('close', () => this._socket = undefined)
          .on('error', () => {})
          .on('message', this.onMessage.bind(this))
          .on('listening', () => {})
          .on('connect', () => {}) as any
      }
    })
  }

  protected abstract onMessage(data: Buffer): void

  public send(str: string | Uint8Array): Promise<void> {
    this.emit('send', str)
    return new Promise((resolve, reject) => {
      this.connect().catch(reject).then(() => {
        const onError = (e?: Error | null) => e ? reject(e) : resolve()
        const socket = this._socket
        if (this._isTcpSocket(socket)) {
          socket.write(str, onError)
        } else if (this._isUdpSocket(socket)) {
          socket.send(str, 0, str.length, this.port, this.host, onError)
        } else {
          reject(new Error('Socket is closed'))
        }
      })
    })
  }

  protected setObject(object: Record<string, any>) {
    for (const key of Object.getOwnPropertyNames(this)) {
      if (!key.startsWith('_') && object[key] !== undefined) {
        (this as any)[key] = object[key]
      }
    }
  }

  public toObject() {
    const object: Record<string, any> = {}
    for (const key of Object.getOwnPropertyNames(this)) {
      if (!key.startsWith('_') && (this as any)[key] !== undefined) {
        object[key] = (this as any)[key]
      }
    }
    return object
  }
}
