import fs from 'node:fs'
import path from 'node:path'

export function cache(filename: string, value?: any): any {
  const dir = path.dirname(filename)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  if (!fs.existsSync(filename)) {
    fs.writeFileSync(filename, '', 'utf8')
  }
  if (value) {
    fs.writeFileSync(filename, JSON.stringify(value), 'utf8')
    return value
  } else {
    return JSON.parse(fs.readFileSync(filename, 'utf8') || '') || undefined
  }
}
