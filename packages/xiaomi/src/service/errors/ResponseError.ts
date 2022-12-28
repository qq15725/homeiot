import type { Request } from '../types'
import type { Response } from 'node-fetch'

export class ResponseError extends Error {
  constructor(
    message: string,
    public readonly response?: Response,
    public readonly request?: Request,
  ) {
    super(message)
    this.name = 'ResponseError'
  }
}
