import { createCli } from './cli-create'

createCli()
  .runMatchedCommand()
  ?.catch(() => {
    process.exitCode = 1
  })
