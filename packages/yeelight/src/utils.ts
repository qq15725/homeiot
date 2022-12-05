export function toKebabCase(str: string) {
  return str
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/\B([A-Z])/g, '-$1')
    .toLowerCase()
}

export function toSnakeCase(str: string) {
  return toKebabCase(str).replace(/-/g, '_')
}

export function toCameCase(str: string): string {
  return str.replace(/[-_](\w)/g, (match: string, part: string) => part.toLocaleUpperCase())
}

let id = 0
export function getNextId() {
  return id++
}

export function isPropsMessage(message: Record<string, any>): message is { method: 'props'; params: Record<string, any> } {
  return 'method' in message
    && 'params' in message
    && message.method === 'props'
}

export function isResultMessage(message: Record<string, any>): message is { id: number; result: (string | number)[] } {
  return 'id' in message
    && 'result' in message
    && Array.isArray(message.result)
}

export function isErrorMessage(message: Record<string, any>): message is { id: number; error: { code: number; message: string } } {
  return 'id' in message
    && 'error' in message
    && 'code' in message.error
    && 'message' in message.error
}
