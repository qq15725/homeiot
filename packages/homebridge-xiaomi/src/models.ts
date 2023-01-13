import type { DeviceModelsMap, Model } from './types'

export const sharedModels: Model[] = [
  {
    service: 'AccessoryInformation',
    characteristics: {
      Manufacturer: 'device-information:manufacturer',
      Model: 'device-information:model',
      Name: {
        name: 'device-information:name',
        get: (v, device) => v ?? device.get('name') ?? 'name',
      },
      SerialNumber: 'device-information:serial-number',
      FirmwareRevision: 'device-information:firmware-revision',
    },
  },
]

export const deviceModelsMap: DeviceModelsMap = {
  'air-purifier': [
    {
      service: 'AirPurifier',
      characteristics: {
        Active: {
          name: 'air-purifier:on',
          // in  true | false
          // out 0: INACTIVE 1: ACTIVE
          get: v => v ? 1 : 0,
          set: v => Boolean(v),
        },
        CurrentAirPurifierState: {
          name: 'air-purifier:on',
          // in  true | false
          // out 0: INACTIVE 1: IDLE 2: PURIFYING_AIR
          get: v => v ? 2 : 0,
        },
        TargetAirPurifierState: {
          name: 'air-purifier:mode',
          // in  0: Auto 1: Sleep 2: Favorite
          // out 0: MANUAL 1: AUTO
          get: v => [0, 1].includes(v) ? 1 : 0,
          set: v => [1].includes(v) ? 0 : 2,
        },
        // Optional
        LockPhysicalControls: 'physical-controls-locked:physical-controls-locked',
        RotationSpeed: device => {
          const keys = [
            'air-purifier-favorite:favorite-fan-level',
            'motor-speed:favorite-fan-level',
            'motor-speed:motor-favorite',
          ]
          for (const key of keys) {
            if (!device.specProperties.has(key)) continue
            const range = device.specProperties.get(key)?.['value-range']
            if (!range) continue
            const [, max] = range
            return {
              name: key,
              get: val => {
                return Math.round(val / max * 100)
              },
            }
          }
          return undefined
        },
        // SwingMode: null,
      },
    },
  ],
  'speaker': [
    {
      service: 'Switch',
      characteristics: {
        On: {
          name: 'play-control:playing-state',
          // in  1: Playing
          // out true | false
          get: v => v === 1,
          set: (v, device) => {
            if (v) {
              device.action('intelligent-speaker:play-music')
            } else {
              device.action('play-control:pause')
            }
            device.set('play-control:playing-state', v ? 1 : 0)
          },
        },
        // TargetMediaState: {
        //   name: 'play-control:playing-state',
        //   // 0: PLAY 1: PAUSE 2: STOP
        //   get: v => v === 1 ? 0 : 1,
        // },
        // // Optional
        // Volume: 'speaker:volume',
        // Mute: 'speaker:mute',
      },
    },
  ],
}
