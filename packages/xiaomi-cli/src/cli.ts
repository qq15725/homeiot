import { config as loadEnv } from 'dotenv'
import consola from 'consola'
import { createCli } from './cli-create'

createCli({ ...loadEnv().parsed, cwd: process.cwd() }).then(cli => {
  cli.runMatchedCommand()
    ?.catch((err: unknown) => {
      consola.error(err)
      process.exitCode = 1
    })
    ?.finally(() => {
      cli.emit('end')
    })
})

