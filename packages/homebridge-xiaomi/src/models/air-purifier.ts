import { createSharedModelServices, defineModel } from '../model'

/**
 * hanyi.airpurifier.kj550
 * zhimi.airp.cpa4
 * zhimi.airp.mb3a
 * zhimi.airp.mb4a
 * zhimi.airp.mb5
 * zhimi.airp.mp4
 * zhimi.airp.rmb1
 * zhimi.airp.sa4
 * zhimi.airp.vb2a
 * zhimi.airp.vb4
 * zhimi.airpurifier.m1
 * zhimi.airpurifier.m2
 * zhimi.airpurifier.ma2
 * zhimi.airpurifier.mb3
 * zhimi.airpurifier.mb4
 * zhimi.airpurifier.mc1
 * zhimi.airpurifier.mc2
 * zhimi.airpurifier.sb1
 * zhimi.airpurifier.v3
 * zhimi.airpurifier.v6
 * zhimi.airpurifier.v7
 * zhimi.airpurifier.va1
 * zhimi.airpurifier.vb2
 * zhimi.airpurifier.xa1
 * zhimi.airpurifier.za1
 */
export const airPurifier = defineModel(env => {
  const { device, api } = env

  const {
    AirPurifier,
    AirQualitySensor,
    HumiditySensor,
    TemperatureSensor,
  } = api.hap.Service

  const {
    Active,
    CurrentAirPurifierState,
    TargetAirPurifierState,
    LockPhysicalControls,
    RotationSpeed,
    AirQuality,
    PM2_5Density,
    CurrentRelativeHumidity,
    CurrentTemperature,
  } = api.hap.Characteristic

  let speed = ''
  let speedRange: number[] = []
  ;[
    'air-purifier-favorite:favorite-fan-level',
    'motor-speed:favorite-fan-level',
    'motor-speed:motor-favorite',
  ].forEach(key => {
    if (device.spec?.properties.has(key)) {
      speed = key
      speedRange = device.spec.properties.get(key)?.['value-range'] as any
    }
  })

  return {
    services: [
      ...createSharedModelServices(env),
      {
        uuid: AirPurifier,
        characteristics: [
          {
            uuid: Active,
            get: () => {
              return device.get('air-purifier:on')
                ? Active.ACTIVE
                : Active.INACTIVE
            },
            set: async val => {
              if (!device.get('air-purifier:on')) {
                await device.setProp('air-purifier:on', Boolean(val))
              }
            },
          },
          {
            uuid: CurrentAirPurifierState,
            get: () => {
              return device.get('air-purifier:on')
                ? CurrentAirPurifierState.PURIFYING_AIR
                : CurrentAirPurifierState.INACTIVE
            },
          },
          {
            uuid: TargetAirPurifierState,
            // 0: Auto 1: Sleep 2: Favorite
            get: () => {
              return [0, 1].includes(device.get('air-purifier:mode'))
                ? TargetAirPurifierState.AUTO
                : TargetAirPurifierState.MANUAL
            },
            set: async val => {
              await device.setProp('air-purifier:mode', val === TargetAirPurifierState.AUTO ? 0 : 2)
            },
          },
          {
            uuid: LockPhysicalControls,
            get: () => {
              return device.get('physical-controls-locked:physical-controls-locked', false)
            },
            set: async val => {
              await device.setProp('physical-controls-locked:physical-controls-locked', val)
            },
          },
          Boolean(speed) && {
            uuid: RotationSpeed,
            get: () => Math.round(device.get(speed) / speedRange[1] * 100),
          },
        ],
      },
      {
        uuid: AirQualitySensor,
        characteristics: [
          {
            uuid: AirQuality,
            get: () => {
              const density = device.get('environment:pm2_5-density')
              if (density === undefined) {
                return AirQuality.UNKNOWN
              } else if (density < 10) {
                return AirQuality.EXCELLENT
              } else if (density < 30) {
                return AirQuality.GOOD
              } else if (density < 60) {
                return AirQuality.FAIR
              } else if (density < 120) {
                return AirQuality.INFERIOR
              }
              return AirQuality.POOR
            },
          },
          {
            uuid: PM2_5Density,
            get: () => device.get('environment:pm2_5-density'),
          },
        ],
      },
      {
        uuid: HumiditySensor,
        characteristics: [
          {
            uuid: CurrentRelativeHumidity,
            get: () => device.get('environment:relative-humidity'),
          },
        ],
      },
      {
        uuid: TemperatureSensor,
        characteristics: [
          {
            uuid: CurrentTemperature,
            get: () => device.get('environment:temperature'),
          },
        ],
      },
    ],
  }
})
