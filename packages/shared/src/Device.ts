import { createSocket as createUdpSocket } from 'node:dgram'
import { Socket as TcpSocket } from 'node:net'
import { EventEmitter } from './EventEmitter'
import type { SocketConstructorOpts } from 'node:net'
import type { Socket as UdpSocket } from 'node:dgram'

export abstract class Device extends EventEmitter {
  private socket?: TcpSocket | UdpSocket

  constructor(
    public readonly host: string,
    public readonly port: number,
    public readonly options?: {
      type?: 'tcp' | 'udp4' | 'udp6'
      encoding?: BufferEncoding
      timeout?: number
    } & SocketConstructorOpts,
  ) {
    super()
  }

  private isTcpSocket(socket: any): socket is TcpSocket {
    return (this.options?.type ?? 'tcp') === 'tcp' && Boolean(this.socket)
  }

  private isUdpSocket(socket: any): socket is UdpSocket {
    return !this.isTcpSocket(this.socket) && Boolean(this.socket)
  }

  public connect(): Promise<this> {
    return new Promise((resolve, reject) => {
      const type = this.options?.type ?? 'tcp'
      if (type === 'tcp') {
        const socketRaw = this.socket
        if (this.isTcpSocket(socketRaw)) {
          if (socketRaw.connecting) {
            return (async () => {
              let tryCounts = 0
              // eslint-disable-next-line no-unmodified-loop-condition
              while (socketRaw && socketRaw.connecting && ++tryCounts < 30) {
                await new Promise(resolve => setTimeout(resolve, 100))
              }
              if (tryCounts >= 30) {
                reject(new Error('Socket connect timeout'))
              } else {
                resolve(this)
              }
            })()
          }
          return resolve(this)
        }
        const socket = new TcpSocket(this.options)
        const onConnectTimeout = () => socket.destroy(new Error('Socket connect timeout'))
        const onConnectError = reject
        this.socket = socket
          .connect(this.port, this.host)
          .setTimeout(3000)
          .once('timeout', onConnectTimeout)
          .once('error', onConnectError)
          .once('close', () => this.socket = undefined)
          .once('connect', () => {
            socket
              .off('timeout', onConnectTimeout)
              .off('error', onConnectError)
              .setEncoding(this.options?.encoding ?? 'utf8')
              .setTimeout(this.options?.timeout ?? 3000)
              .on('data', this.onMessage.bind(this))
            resolve(this)
          }) as any
      } else {
        this.socket = createUdpSocket(type)
          .bind(this.port)
          .once('close', () => this.socket = undefined)
          .on('error', () => {})
          .on('message', this.onMessage.bind(this))
          .on('listening', () => {})
          .on('connect', () => {}) as any
      }
    })
  }

  public async send(str: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = this.socket
      const onError = (e?: Error | null) => e ? reject(e) : resolve()
      if (this.isTcpSocket(socket)) {
        this.connect().then(() => socket.write(str, onError))
      } else if (this.isUdpSocket(socket)) {
        socket.send(str, this.port, this.host, onError)
      } else {
        reject(new Error('Socket is closed'))
      }
    })
  }

  protected abstract onMessage(data: Buffer): void
}
