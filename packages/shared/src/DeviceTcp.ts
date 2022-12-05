import { Socket } from 'node:net'
import { EventEmitter } from './EventEmitter'
import type { SocketConstructorOpts } from 'node:net'

// export type DeviceTcpEvents = {
//   message: (message: Buffer) => void
//   error: (error: Error) => void
//   connecting: () => void
//   connected: () => void
//   disconnected: (hadError: boolean) => void
// }

export abstract class DeviceTcp extends EventEmitter {
  public readonly socket: Socket

  protected status: 'disconnected' | 'connecting' | 'connected' = 'disconnected'

  public get disconnected() {
    return this.status === 'disconnected'
  }

  public get connecting() {
    return this.status === 'connecting'
  }

  public get connected() {
    return this.status === 'connected'
  }

  constructor(
    public readonly host: string,
    public readonly port: number,
    socketOptions?: Partial<SocketConstructorOpts>,
  ) {
    super()
    this.socket = new Socket(socketOptions)
    this.socket.on('data', data => this.emit('message', data))
    this.socket.on('error', error => this.emit('error', error))
    this.socket.on('close', hadError => {
      this.status = 'disconnected'
      this.emit('disconnected', hadError)
    })
  }

  protected async awaitConnect() {
    while (this.connecting) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  public connect(): Promise<this> {
    return new Promise((resolve, reject) => {
      if (this.connected) return resolve(this)
      if (this.socket.connecting) return this.awaitConnect().then(() => resolve(this))
      this.status = 'connecting'
      this.emit('connecting')
      const onError = (err: Error) => reject(err)
      const onClose = (hadError: boolean) => reject(new Error(`close: error? ${ hadError }`))
      this.socket.once('error', onError)
      this.socket.once('close', onClose)
      this.socket.connect(
        this.port,
        this.host,
        () => {
          this.socket.off('error', onError)
          this.socket.off('close', onClose)
          this.status = 'connected'
          this.emit('connected')
          resolve(this)
        },
      )
    })
  }

  public disconnect() {
    this.socket.destroy()
  }

  public async send(str: Uint8Array | string, encoding?: BufferEncoding): Promise<Error | undefined> {
    await this.connect()
    return new Promise(resolve => {
      this.socket.write(str, encoding, resolve)
    })
  }
}
