export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export function pathToPaths(path: string) {
  return path
    .replace(/\[(\w+)]/g, '.$1')
    .replace(/^\./, '')
    .split('.')
}

export function getNestedValue(obj: any, path: (string | number)[], fallback?: any): any {
  const last = path.length - 1
  if (last < 0) return obj === undefined ? fallback : obj
  for (let i = 0; i < last; i++) {
    if (obj == null) {
      return fallback
    }
    obj = obj[path[i]]
  }
  if (obj == null) return fallback
  return obj[path[last]] === undefined ? fallback : obj[path[last]]
}

export function setNestedValue(obj: any, path: (string | number)[], value: any) {
  const last = path.length - 1
  for (let i = 0; i < last; i++) {
    if (typeof obj[path[i]] !== 'object') obj[path[i]] = {}
    obj = obj[path[i]]
  }
  obj[path[last]] = value
}
