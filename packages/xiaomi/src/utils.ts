export function randomString(length: number, charset: string) {
  let result = ''
  const charsetLen = charset.length
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charsetLen))
  }
  return result
}

export class CryptRC4 {
  private _ksa: number[] = []
  private _idx: number
  private _jdx: number

  constructor(key: string | Buffer, rounds: number) {
    const ksa = Array.from({ length: 256 }, (v, k) => k)
    let i = 0
    let j = 0
    if (key.length > 0) {
      key = Buffer.from(key)
      const len = key.length
      for (i = 0; i < 256; i++) {
        j = (j + ksa[i] + key[i % len]) & 255;
        [ksa[i], ksa[j]] = [ksa[j], ksa[i]]
      }
      i = j = 0
      for (let c = 0; c < rounds; c++) {
        i = (i + 1) & 255
        j = (j + ksa[i]) & 255;
        [ksa[i], ksa[j]] = [ksa[j], ksa[i]]
      }
    }
    this._ksa = ksa
    this._idx = i
    this._jdx = j
  }

  crypt(data: Buffer) {
    const ksa = this._ksa.slice(0) // Array copy
    let i = this._idx || 0
    let j = this._jdx || 0
    const len = data.length
    const out = Buffer.alloc(len)
    for (let c = 0; c < len; c++) {
      i = (i + 1) & 255
      j = (j + ksa[i]) & 255;
      [ksa[i], ksa[j]] = [ksa[j], ksa[i]]
      out[c] = data[c] ^ ksa[(ksa[i] + ksa[j]) & 255]
    }
    return out
  }

  encode(data: string) {
    return this.crypt(Buffer.from(data, 'utf8')).toString('base64')
  }

  decode(data: string) {
    return this.crypt(Buffer.from(data, 'base64')).toString('utf8')
  }
}
