import type { RequestInit } from 'node-fetch'

export interface Request {
  url: string
  init?: RequestInit
  context?: Record<string, any>
}
