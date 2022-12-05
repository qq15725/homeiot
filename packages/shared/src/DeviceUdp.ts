import { createSocket } from 'node:dgram'
import { EventEmitter } from 'node:events'
import type { Socket, SocketOptions } from 'node:dgram'

export class DeviceUdp extends EventEmitter {
  public readonly socket: Socket

  constructor(
    public readonly host: string,
    public readonly port: number,
    public readonly socketOptions?: Partial<SocketOptions>,
  ) {
    super()
    this.socket = createSocket({ type: 'udp4', ...this.socketOptions })
    this.socket.on('message', (...args) => this.emit('message', ...args))
    this.socket.on('error', error => this.emit('error', error))
  }

  public start(): Promise<this> {
    return new Promise((resolve, reject) => {
      const onError = (error: Error) => reject(error)
      this.socket.once('error', onError)
      this.socket.bind(this.port, () => {
        this.socket.off('error', onError)
        resolve(this)
      })
    })
  }
}
