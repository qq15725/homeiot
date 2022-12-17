export const EOL = '\r\n'

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
