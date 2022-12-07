import { createSocket } from 'node:dgram'
import { EventEmitter } from './EventEmitter'
import type { RemoteInfo, Socket, SocketOptions } from 'node:dgram'

export abstract class Discovery extends EventEmitter {
  private socket?: Socket

  constructor(
    public readonly multicastHost: string,
    public readonly multicastPort: number,
    public readonly queryMessage: string,
    public readonly options?: Partial<SocketOptions> & {
      serverHost?: string
      serverPort?: number
      multicastTtl?: number
      multicastInterface?: string
    },
  ) {
    super()
  }

  public discover(): Promise<void> {
    return new Promise((resolve, reject) => {
      const buffer = Buffer.from(this.queryMessage)
      this.socket?.send(
        buffer, 0, buffer.length, this.multicastPort, this.multicastHost,
        err => err ? reject(err) : resolve(),
      )
    })
  }

  public start(): Promise<this> {
    return new Promise((resolve, reject) => {
      const onError = reject
      const socket = createSocket({
        type: 'udp4',
        reuseAddr: true,
        ...this.options,
      })
      this.socket = socket
        .once('error', onError)
        .once('listening', () => {
          socket
            .off('error', onError)
            .on('message', this.onMessage.bind(this))
            .on('error', error => this.emit('error', error))
          socket.setBroadcast(true)
          socket.addMembership(this.multicastHost)
          socket.setMulticastTTL(this.options?.multicastTtl ?? 128)
          if (this.options?.multicastInterface) socket.setMulticastInterface(this.options?.multicastInterface)
          this.discover().finally(() => resolve(this))
          this.emit('started')
        })
        .bind(this.options?.serverPort, this.options?.serverHost)
    })
  }

  protected abstract onMessage(buffer: Buffer, remote: RemoteInfo): void
}
