import type { DeviceSupportedMethods } from './types'

export const models = {
  mono: {
    modelName: 'Serene Eye-Friendly Desk Lamp',
    supportColorTemperature: { min: 0, max: 0 },
    supportNightLight: false,
    supportBackgroundLight: false,
    supportColor: false,
  },
  stripe: {
    modelName: 'Lightstrip Plus',
    supportColorTemperature: { min: 1700, max: 6500 },
    supportNightLight: false,
    supportBackgroundLight: false,
    supportColor: true,
  },
  mono1: {
    modelName: 'Mono Light',
    supportColorTemperature: { min: 0, max: 0 },
    supportNightLight: false,
    supportBackgroundLight: false,
    supportColor: false,
  },
  color: {
    modelName: 'Color Light',
    supportColorTemperature: { min: 1700, max: 6500 },
    supportNightLight: false,
    supportBackgroundLight: false,
    supportColor: true,
  },
  color1: {
    modelName: 'Color Light',
    supportColorTemperature: { min: 1700, max: 6500 },
    supportNightLight: false,
    supportBackgroundLight: false,
    supportColor: true,
  },
  strip1: {
    modelName: 'Light Strip',
    supportColorTemperature: { min: 1700, max: 6500 },
    supportNightLight: false,
    supportBackgroundLight: false,
    supportColor: true,
  },
  RGBW: {
    modelName: 'RGBW',
    supportColorTemperature: { min: 1700, max: 6500 },
    supportNightLight: false,
    supportBackgroundLight: false,
    supportColor: true,
  },
  bslamp1: {
    modelName: 'Bedside Lamp',
    supportColorTemperature: { min: 1700, max: 6500 },
    supportNightLight: false,
    supportBackgroundLight: false,
    supportColor: true,
  },
  bslamp2: {
    modelName: 'Bedside Lamp 2',
    supportColorTemperature: { min: 1700, max: 6500 },
    supportNightLight: false,
    supportBackgroundLight: false,
    supportColor: true,
  },
  ceiling1: {
    modelName: 'Ceiling Light',
    supportColorTemperature: { min: 2700, max: 6500 },
    supportNightLight: true,
    supportBackgroundLight: false,
    supportColor: false,
  },
  ceiling2: {
    modelName: 'Ceiling Light - Youth Version',
    supportColorTemperature: { min: 2700, max: 6500 },
    supportNightLight: true,
    supportBackgroundLight: false,
    supportColor: false,
  },
  ceiling3: {
    modelName: 'Ceiling Light (Jiaoyue 480)',
    supportColorTemperature: { min: 2700, max: 6500 },
    supportNightLight: true,
    supportBackgroundLight: false,
    supportColor: false,
  },
  ceiling4: {
    modelName: 'Moon Pro (Jiaoyue 650)',
    supportColorTemperature: { min: 2700, max: 6500 },
    supportNightLight: true,
    supportBackgroundLight: true,
    supportColor: false,
  },
  ceiling5: {
    modelName: 'Mi LED Ceiling Light',
    supportColorTemperature: { min: 2700, max: 6500 },
    supportNightLight: true,
    supportBackgroundLight: false,
    supportColor: false,
  },
  ceiling10: {
    modelName: 'Meteorite',
    supportColorTemperature: { min: 2700, max: 6500 },
    supportNightLight: false,
    supportBackgroundLight: true,
    supportColor: false,
  },
  ceiling11: {
    modelName: 'Ceiling Light (YLXD41YL)',
    supportColorTemperature: { min: 2700, max: 6500 },
    supportNightLight: true,
    supportBackgroundLight: false,
    supportColor: false,
  },
  ceiling13: {
    modelName: 'Ceiling Light (A2001R900)',
    supportColorTemperature: { min: 2700, max: 6500 },
    supportNightLight: true,
    supportBackgroundLight: false,
    supportColor: false,
  },
  ceiling14: {
    modelName: 'Ceiling Light (A2001C550)',
    supportColorTemperature: { min: 2700, max: 6500 },
    supportNightLight: true,
    supportBackgroundLight: false,
    supportColor: false,
  },
  ceiling15: {
    modelName: 'Ceiling Light (YLXD42YL)',
    supportColorTemperature: { min: 2700, max: 6500 },
    supportNightLight: true,
    supportBackgroundLight: true,
    supportColor: false,
  },
  ceiling18: {
    modelName: 'Ceiling Light (A2001C450)',
    supportColorTemperature: { min: 2700, max: 6500 },
    supportNightLight: true,
    supportBackgroundLight: false,
    supportColor: false,
  },
  ceiling20: {
    modelName: 'GuangCan Ceiling Light',
    supportColorTemperature: { min: 2700, max: 6500 },
    supportNightLight: true,
    supportBackgroundLight: true,
    supportColor: false,
  },
  color2: {
    modelName: 'color2',
    supportColorTemperature: { min: 2700, max: 6500 },
    supportNightLight: false,
    supportBackgroundLight: false,
    supportColor: true,
  },
  color4: {
    modelName: 'color4',
    supportColorTemperature: { min: 2700, max: 6500 },
    supportNightLight: false,
    supportBackgroundLight: false,
    supportColor: true,
  },
  lamp1: {
    modelName: 'Color Temperature bulb',
    supportColorTemperature: { min: 2700, max: 6500 },
    supportNightLight: false,
    supportBackgroundLight: false,
    supportColor: false,
  },
  lamp9: {
    modelName: 'Staria Bedside Lamp Pro',
    supportColorTemperature: { min: 2700, max: 6500 },
    supportNightLight: false,
    supportBackgroundLight: false,
    supportColor: false,
  },
  desklamp: {
    modelName: 'Desk Lamp',
    supportColorTemperature: { min: 2700, max: 6599 },
    supportNightLight: false,
    supportBackgroundLight: false,
    supportColor: false,
  },
  ceila: {
    modelName: 'A2001 Ceiling Light',
    supportColorTemperature: { min: 2700, max: 6500 },
    supportNightLight: true,
    supportBackgroundLight: false,
    supportColor: false,
  },
  ceilc: {
    modelName: 'Arwen Ceiling Light 550C',
    supportColorTemperature: { min: 2700, max: 6500 },
    supportNightLight: true,
    supportBackgroundLight: true,
    supportColor: false,
  },
  lamp15: {
    modelName: 'Monitor Hanging Light',
    supportColorTemperature: { min: 2700, max: 6500 },
    supportNightLight: true,
    supportBackgroundLight: true,
    supportColor: false,
  },
} as const

export function parseModel(model?: string, support?: DeviceSupportedMethods) {
  if (model) {
    if (model in models) return models[model as keyof typeof models]
    if (model.startsWith('mono')) return models.mono
    if (model.startsWith('stripe')) return models.stripe
    if (model.startsWith('color')) return models.color
  }

  return {
    modelName: undefined,
    supportColorTemperature: support?.includes('set_ct_abx')
      ? { min: 2700, max: 2700 }
      : false,
    supportColor: Boolean(support?.includes('set_hsv')),
    supportBackgroundLight: Boolean(support?.includes('bg_set_hsv')),
    supportNightLight: false,
  }
}
