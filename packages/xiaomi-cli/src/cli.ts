import consola from 'consola'
import { createCli } from './cli-create'

createCli()
  .runMatchedCommand()
  ?.catch((err: unknown) => {
    consola.error(err)
    process.exitCode = 1
  })
