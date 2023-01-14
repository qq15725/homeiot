import { createSharedModelServices, defineModel } from '../model'
import type { ModelService } from '@homeiot/shared-homebridge'

/**
 * xiaomi.wifispeaker.lx06
 * xiaomi.wifispeaker.l05b
 */
export const speaker = defineModel(env => {
  const { device, api } = env

  const {
    Lightbulb,
    Switch,
  } = api.hap.Service

  const {
    On,
    Brightness,
  } = api.hap.Characteristic

  function createStatlessSwitch(subType: string, action: string): ModelService {
    return {
      uuid: Switch,
      subType,
      displayName: subType,
      characteristics: [
        {
          uuid: On,
          value: false,
          set: (_val, { characteristic }) => {
            device.action(action)
            setTimeout(() => characteristic.updateValue(false), 100)
          },
        },
      ],
    }
  }

  return {
    services: [
      ...createSharedModelServices(env),
      {
        uuid: Lightbulb,
        characteristics: [
          {
            uuid: On,
            value: true,
            set: (_val, { characteristic }) => {
              setTimeout(() => characteristic.updateValue(true), 100)
            },
          },
          {
            uuid: Brightness,
            get: () => device.get('speaker:volume'),
            set: async val => {
              await device.setProp('speaker:volume', val)
            },
          },
        ],
      },
      createStatlessSwitch('play', 'play-control:play'),
      createStatlessSwitch('pause', 'play-control:pause'),
      createStatlessSwitch('next', 'play-control:next'),
      createStatlessSwitch('previous', 'play-control:previous'),
    ],
  }
})
