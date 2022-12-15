export function getRandomString({ length, charset }: { length: number; charset: string }) {
  let result = ''
  const charsetLen = charset.length
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charsetLen))
  }
  return result
}
