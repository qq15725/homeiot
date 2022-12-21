import { createSocket } from 'node:dgram'
import { EventEmitter } from './EventEmitter'
import type { RemoteInfo, Socket as Udp, SocketOptions as UdpOptions } from 'node:dgram'

export type BaseDiscoveryEvents = {
  error: (error: Error) => void
  didFinishLaunching: () => void
}

export abstract class BaseDiscovery extends EventEmitter {
  private _client?: Udp

  constructor(
    public readonly multicastHost: string,
    public readonly multicastPort: number,
    public readonly helloPacket: string | Buffer,
    public readonly options?: Partial<UdpOptions> & {
      serverHost?: string
      serverPort?: number
      multicastTtl?: number
      multicastInterface?: string
    },
  ) {
    super()
  }

  public sendHelloPacket(): Promise<this> {
    const buffer = typeof this.helloPacket === 'string'
      ? Buffer.from(this.helloPacket)
      : this.helloPacket

    return new Promise((resolve, reject) => {
      this._client?.send(
        buffer, 0, buffer.length, this.multicastPort, this.multicastHost,
        err => err ? reject(err) : resolve(this),
      )
    })
  }

  public start(): Promise<this> {
    if (this._client) return Promise.resolve(this)

    const {
      type = 'udp4',
      reuseAddr = true,
      multicastTtl = 128,
      multicastInterface,
      serverPort,
      serverHost,
      ...options
    } = this.options ?? {}

    const onError = this.onError.bind(this)
    const onClose = this.onClose.bind(this)
    const onMessage = this.onMessage.bind(this)

    return new Promise(resolve => {
      const onListenError = (err: Error) => onError(err); resolve(this)
      this._client = createSocket({ type, reuseAddr, ...options })
        .once('error', onListenError)
        .once('listening', () => {
          this._client
            ?.off('error', onListenError)
            .on('error', onError)
            .once('close', onClose)
            .on('message', onMessage)
          this._client?.setBroadcast(true)
          if (this.multicastHost !== '255.255.255.255') {
            this._client?.addMembership(this.multicastHost)
          }
          this._client?.setMulticastTTL(multicastTtl)
          if (multicastInterface) this._client?.setMulticastInterface(multicastInterface)
          resolve(this)
          this.emit('didFinishLaunching')
          this.sendHelloPacket().catch(onError)
        })
        .bind(serverPort, serverHost)
    })
  }

  public stop(): Promise<this> {
    return new Promise(resolve => {
      if (!this._client) return resolve(this)
      this._client.close(() => resolve(this))
    })
  }

  // overrideable
  protected onError(err: Error) {
    this.emit('error', err)
  }

  // overrideable
  protected onClose() {
    this._client = undefined
  }

  // overrideable
  protected onMessage(_message: Buffer, _remote: RemoteInfo) {}
}
