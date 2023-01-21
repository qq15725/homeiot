import { createSharedModelServices, defineModel } from '../model'

/**
 * hyd.airer.znlyj1
 * hyd.airer.znlyj2
 * hyd.airer.znlyj4
 * hyd.airer.lyjpro
 */
export const airer = defineModel(env => {
  const { device, api } = env

  const {
    Lightbulb,
  } = api.hap.Service

  const {
    On,
  } = api.hap.Characteristic

  return {
    services: [
      ...createSharedModelServices(env),
      {
        uuid: Lightbulb,
        characteristics: [
          {
            uuid: On,
            get: () => device.get('light:on'),
            set: async val => {
              await device.setProp('light:on', val)
            },
          },
        ],
      },
    ],
  }
})
