#!/usr/bin/env node

const xiaomi = require('../')

const log = console

new xiaomi.Discovery({
  '10.0.0.4': '10.0.0.4',
  '10.0.0.5': '10.0.0.5',
})
  .on('started', () => log.debug('Discovery Started'))
  .on('error', err => log.error(err))
  .on('discovered', device => log.debug(device))
  .start()
  .catch(err => log.error(err))
