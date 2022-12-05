import { createSocket } from 'node:dgram'
import { EventEmitter } from './EventEmitter'
import type { Socket, SocketOptions } from 'node:dgram'

// export type DiscoveryEvents = {
//   message: (message: Buffer, rinfo: RemoteInfo) => void
//   error: (error: Error) => void
// }

export abstract class Discovery extends EventEmitter {
  public readonly socket: Socket

  constructor(
    public readonly host: string,
    public readonly port: number,
    public readonly discoverMessage: string,
    public readonly socketOptions?: Partial<SocketOptions>,
  ) {
    super()
    this.socket = createSocket({ type: 'udp4', ...this.socketOptions })
    this.socket.on('message', (...args) => this.emit('message', ...args))
    this.socket.on('error', (error: Error) => this.emit('error', error))
  }

  public discover(): Promise<this> {
    return new Promise((resolve, reject) => {
      const buffer = Buffer.from(this.discoverMessage)
      this.socket.send(buffer, 0, buffer.length, this.port, this.host, err => {
        if (err) {
          reject(err)
        } else {
          resolve(this)
        }
      })
    })
  }

  public start(): Promise<this> {
    return new Promise((resolve, reject) => {
      const onError = (error: Error) => reject(error)
      this.socket.once('error', onError)
      this.socket.bind(this.port, () => {
        this.socket.off('error', onError)
        this.socket.setBroadcast(true)
        this.socket.setMulticastTTL(128)
        this.socket.addMembership(this.host)
        this.discover().finally(() => resolve(this))
      })
    })
  }
}
