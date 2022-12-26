import { access, readFile, writeFile } from 'node:fs/promises'
import fs from 'node:fs'

export async function cache(filename: string, value?: string): Promise<string> {
  if (await access(filename, fs.constants.F_OK).then(() => true).catch(() => false)) {
    if (!value) {
      return await readFile(filename, 'utf8')
    }
  }
  value = value ?? ''
  await writeFile(filename, value, 'utf8')
  return value
}
