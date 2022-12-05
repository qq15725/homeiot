# Yeelight SDK for Node.js

## Installation

```shell
pnpm add @modern-home/yeelight
```

## Usage

```ts
import { createYeelightDiscovery } from '@modern-home/yeelight'

// discover yeelight device
createYeelightDiscovery().listen({
  onDidDiscoverDevice: async device => {
    device.listen()
    console.log(await device.getProp())
  },
})
```

## Documentation

[Yeelight WiFi Light Inter-Operation Specification](https://www.yeelight.com/download/Yeelight_Inter-Operation_Spec.pdf)
