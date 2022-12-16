import { createInterface } from 'node:readline'
import { Writable } from 'node:stream'

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
