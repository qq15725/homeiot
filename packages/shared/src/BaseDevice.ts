import { createSocket as createUdpSocket } from 'node:dgram'
import { Socket as TcpSocket } from 'node:net'
import { EventEmitter } from './EventEmitter'
import type { SocketConstructorOpts } from 'node:net'
import type { Socket as UdpSocket } from 'node:dgram'

export interface WaitingRequest {
  resolve: any
  reject: any
  timeoutTimer: any
}

export abstract class BaseDevice extends EventEmitter {
  private _socket?: TcpSocket | UdpSocket
  private readonly _waitingRequests = new Map<string, WaitingRequest>()
  private readonly _attributes = new Map<string | number, any>()

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

  public hasAttribute(key: string) {
    return this._attributes.has(key)
  }

  public setAttribute(key: string, value: any) {
    this._attributes.set(key, value)
  }

  public getAttribute(key: string) {
    return this._attributes.get(key)
  }

  public setAttributes(attributes: Record<string, any>) {
    this._attributes.clear()
    for (const [key, value] of Object.entries(attributes)) {
      this._attributes.set(key, value)
    }
  }

  public getAttributes() {
    return {
      ...Object.fromEntries(this._attributes),
      host: this.host,
      port: this.port,
    }
  }

  private _isTcpSocket(socket: any): socket is TcpSocket {
    return (this._options?.type ?? 'tcp') === 'tcp' && Boolean(this._socket)
  }

  private _isUdpSocket(socket: any): socket is UdpSocket {
    return !this._isTcpSocket(this._socket) && Boolean(this._socket)
  }

  public request(id: string, data: string | Uint8Array): Promise<any> {
    return new Promise((resolve, reject) => {
      this.emit('request', data, id)

      const timeoutTimer = setTimeout(() => {
        reject(new Error(`Request timeout ${ id }`))
        this._waitingRequests.delete(id)
      }, 500)

      this._waitingRequests.set(id, {
        resolve: (res: any) => {
          this.emit('response', res, id)
          resolve(res)
        },
        reject,
        timeoutTimer,
      })

      this.send(data).catch(err => {
        this._waitingRequests.delete(id)
        clearTimeout(timeoutTimer)
        reject(err)
      })
    })
  }

  protected pullWaitingRequest(id: string) {
    const waitingRequest = this._waitingRequests.get(id)
    if (waitingRequest) {
      this._waitingRequests.delete(id)
      clearTimeout(waitingRequest.timeoutTimer)
    }
    return waitingRequest
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
              .once('close', () => this._socket = undefined)
              .on('data', this.onMessage.bind(this))
            this.emit('connect')
            resolve(this)
          })
          .connect(this.port, this.host)
      } else {
        if (this._isUdpSocket(socketRaw)) {
          return resolve(this)
        }
        this._socket = createUdpSocket({ type, reuseAddr: true })
          .on('error', err => this.emit('error', err))
          .once('close', () => this._socket = undefined)
          .on('message', this.onMessage.bind(this))
          .on('listening', () => {
            this.emit('listening')
            resolve(this)
          })
          .on('connect', () => this.emit('connect'))
          .bind(this.port)
      }
    })
  }

  protected abstract onMessage(message: Buffer): void

  public send(data: string | Uint8Array): Promise<void> {
    return new Promise((resolve, reject) => {
      this.connect().catch(reject).then(() => {
        const onError = (e?: Error | null) => e ? reject(e) : resolve()
        const socket = this._socket
        if (this._isTcpSocket(socket)) {
          socket.write(data, onError)
        } else if (this._isUdpSocket(socket)) {
          socket.send(data, 0, data.length, this.port, this.host, onError)
        } else {
          reject(new Error('Socket is closed'))
        }
      })
    })
  }
}
