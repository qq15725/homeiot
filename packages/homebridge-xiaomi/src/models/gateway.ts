import { createSharedModelServices, defineModel } from '../model'

/**
 * lumi.gateway.mcn001
 */
export const gateway = defineModel(env => {
  const { device, api } = env

  const {
    Switch,
  } = api.hap.Service

  const {
    On,
  } = api.hap.Characteristic

  return {
    services: [
      ...createSharedModelServices(env),
      {
        uuid: Switch,
        characteristics: [
          {
            uuid: On,
            value: false,
            set: (_val, { characteristic }) => {
              device.action('identify:identify')
              setTimeout(() => characteristic.updateValue(false), 100)
            },
          },
        ],
      },
    ],
  }
})
