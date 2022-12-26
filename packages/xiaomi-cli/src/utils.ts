import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { createInterface } from 'node:readline'
import { Writable } from 'node:stream'

interface LookupFileOptions {
  pathOnly?: boolean
  rootDir?: string
  predicate?: (file: string) => boolean
}

export function lookupFile(
  dir: string,
  formats: string[],
  options?: LookupFileOptions,
): string | undefined {
  for (const format of formats) {
    const fullPath = path.join(dir, format)
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      const result = options?.pathOnly
        ? fullPath
        : fs.readFileSync(fullPath, 'utf-8')
      if (!options?.predicate || options.predicate(result)) {
        return result
      }
    }
  }
  const parentDir = path.dirname(dir)
  if (
    parentDir !== dir
    && (!options?.rootDir || parentDir.startsWith(options?.rootDir))
  ) {
    return lookupFile(parentDir, formats, options)
  }
  return undefined
}

export function slash(p: string): string {
  return p.replace(/\\/g, '/')
}

export const isWindows = os.platform() === 'win32'

export function normalizePath(id: string): string {
  return path.posix.normalize(isWindows ? slash(id) : id)
}

export function getPasswordByTerminalInput(
  input = process.stdin,
  output = process.stdout,
): Promise<string> {
  return new Promise(resolve => {
    let muted = false
    const readline = createInterface({
      input,
      output: new Writable({
        write(chunk, encoding, callback) {
          if (!muted) output.write(chunk, encoding)
          callback()
        },
      }),
      terminal: true,
    })
    readline.question('Password:', password => {
      readline.close()
      output.write('\r\n')
      resolve(String(password))
    })
    muted = true
  })
}
