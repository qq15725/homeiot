# Aqara SDK for Node.js

## Installation

```shell
pnpm add @homeiot/aqara
```

## Usage

### Discover device

```ts
import { Discovery } from '@homeiot/aqara'

const log = console

new Discovery()
  .on('started', () => log.debug('Discovery Started'))
  .on('error', err => log.error(err))
  .on('discovered', device => log.debug(device))
  .start()
  .catch(err => log.error(err))
```

## Documentation

[aqara/aiot-gateway-local-api](https://github.com/aqara/aiot-gateway-local-api)
