import { EventEmitter as BaseEventEmitter } from 'node:events'

export type EmittedEvents = {
  [key: string | symbol]: (...args: any[]) => void
}

export abstract class EventEmitter<T extends EmittedEvents = EmittedEvents> extends BaseEventEmitter {
  protected constructor() {
    super()
  }

  addListener<K extends keyof T>(event: K, listener: (...args: Parameters<T[K]>) => void) {
    return super.addListener(event as any, listener as any)
  }

  removeListener<K extends keyof T>(event: K, listener: (...args: Parameters<T[K]>) => void) {
    return super.removeListener(event as any, listener as any)
  }

  on<K extends keyof T>(event: K, listener: (...args: Parameters<T[K]>) => void) {
    return super.on(event as any, listener as any)
  }

  once<K extends keyof T>(event: K, listener: (...args: Parameters<T[K]>) => void) {
    return super.once(event as any, listener as any)
  }

  off<K extends keyof T>(event: K, listener: (...args: Parameters<T[K]>) => void) {
    return super.off(event as any, listener as any)
  }

  emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>) {
    return super.emit(event as any, ...args)
  }
}
