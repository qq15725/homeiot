import type { DeviceSupportedMethods } from './types'

export const models = {
  mono: {
    modelName: 'Serene Eye-Friendly Desk Lamp',
    supportsColorTemperature: { min: 0, max: 0 },
    supportsNightLight: false,
    supportsBackgroundLight: false,
    supportsColor: false,
  },
  stripe: {
    modelName: 'Lightstrip Plus',
    supportsColorTemperature: { min: 1700, max: 6500 },
    supportsNightLight: false,
    supportsBackgroundLight: false,
    supportsColor: true,
  },
  mono1: {
    modelName: 'Mono Light',
    supportsColorTemperature: { min: 0, max: 0 },
    supportsNightLight: false,
    supportsBackgroundLight: false,
    supportsColor: false,
  },
  color: {
    modelName: 'Color Light',
    supportsColorTemperature: { min: 1700, max: 6500 },
    supportsNightLight: false,
    supportsBackgroundLight: false,
    supportsColor: true,
  },
  color1: {
    modelName: 'Color Light',
    supportsColorTemperature: { min: 1700, max: 6500 },
    supportsNightLight: false,
    supportsBackgroundLight: false,
    supportsColor: true,
  },
  strip1: {
    modelName: 'Light Strip',
    supportsColorTemperature: { min: 1700, max: 6500 },
    supportsNightLight: false,
    supportsBackgroundLight: false,
    supportsColor: true,
  },
  RGBW: {
    modelName: 'RGBW',
    supportsColorTemperature: { min: 1700, max: 6500 },
    supportsNightLight: false,
    supportsBackgroundLight: false,
    supportsColor: true,
  },
  bslamp1: {
    modelName: 'Bedside Lamp',
    supportsColorTemperature: { min: 1700, max: 6500 },
    supportsNightLight: false,
    supportsBackgroundLight: false,
    supportsColor: true,
  },
  bslamp2: {
    modelName: 'Bedside Lamp 2',
    supportsColorTemperature: { min: 1700, max: 6500 },
    supportsNightLight: false,
    supportsBackgroundLight: false,
    supportsColor: true,
  },
  ceiling1: {
    modelName: 'Ceiling Light',
    supportsColorTemperature: { min: 2700, max: 6500 },
    supportsNightLight: true,
    supportsBackgroundLight: false,
    supportsColor: false,
  },
  ceiling2: {
    modelName: 'Ceiling Light - Youth Version',
    supportsColorTemperature: { min: 2700, max: 6500 },
    supportsNightLight: true,
    supportsBackgroundLight: false,
    supportsColor: false,
  },
  ceiling3: {
    modelName: 'Ceiling Light (Jiaoyue 480)',
    supportsColorTemperature: { min: 2700, max: 6500 },
    supportsNightLight: true,
    supportsBackgroundLight: false,
    supportsColor: false,
  },
  ceiling4: {
    modelName: 'Moon Pro (Jiaoyue 650)',
    supportsColorTemperature: { min: 2700, max: 6500 },
    supportsNightLight: true,
    supportsBackgroundLight: true,
    supportsColor: false,
  },
  ceiling5: {
    modelName: 'Mi LED Ceiling Light',
    supportsColorTemperature: { min: 2700, max: 6500 },
    supportsNightLight: true,
    supportsBackgroundLight: false,
    supportsColor: false,
  },
  ceiling10: {
    modelName: 'Meteorite',
    supportsColorTemperature: { min: 2700, max: 6500 },
    supportsNightLight: false,
    supportsBackgroundLight: true,
    supportsColor: false,
  },
  ceiling11: {
    modelName: 'Ceiling Light (YLXD41YL)',
    supportsColorTemperature: { min: 2700, max: 6500 },
    supportsNightLight: true,
    supportsBackgroundLight: false,
    supportsColor: false,
  },
  ceiling13: {
    modelName: 'Ceiling Light (A2001R900)',
    supportsColorTemperature: { min: 2700, max: 6500 },
    supportsNightLight: true,
    supportsBackgroundLight: false,
    supportsColor: false,
  },
  ceiling14: {
    modelName: 'Ceiling Light (A2001C550)',
    supportsColorTemperature: { min: 2700, max: 6500 },
    supportsNightLight: true,
    supportsBackgroundLight: false,
    supportsColor: false,
  },
  ceiling15: {
    modelName: 'Ceiling Light (YLXD42YL)',
    supportsColorTemperature: { min: 2700, max: 6500 },
    supportsNightLight: true,
    supportsBackgroundLight: true,
    supportsColor: false,
  },
  ceiling18: {
    modelName: 'Ceiling Light (A2001C450)',
    supportsColorTemperature: { min: 2700, max: 6500 },
    supportsNightLight: true,
    supportsBackgroundLight: false,
    supportsColor: false,
  },
  ceiling20: {
    modelName: 'GuangCan Ceiling Light',
    supportsColorTemperature: { min: 2700, max: 6500 },
    supportsNightLight: true,
    supportsBackgroundLight: true,
    supportsColor: false,
  },
  color2: {
    modelName: 'color2',
    supportsColorTemperature: { min: 2700, max: 6500 },
    supportsNightLight: false,
    supportsBackgroundLight: false,
    supportsColor: true,
  },
  color4: {
    modelName: 'color4',
    supportsColorTemperature: { min: 2700, max: 6500 },
    supportsNightLight: false,
    supportsBackgroundLight: false,
    supportsColor: true,
  },
  lamp1: {
    modelName: 'Color Temperature bulb',
    supportsColorTemperature: { min: 2700, max: 6500 },
    supportsNightLight: false,
    supportsBackgroundLight: false,
    supportsColor: false,
  },
  lamp9: {
    modelName: 'Staria Bedside Lamp Pro',
    supportsColorTemperature: { min: 2700, max: 6500 },
    supportsNightLight: false,
    supportsBackgroundLight: false,
    supportsColor: false,
  },
  desklamp: {
    modelName: 'Desk Lamp',
    supportsColorTemperature: { min: 2700, max: 6599 },
    supportsNightLight: false,
    supportsBackgroundLight: false,
    supportsColor: false,
  },
  ceila: {
    modelName: 'A2001 Ceiling Light',
    supportsColorTemperature: { min: 2700, max: 6500 },
    supportsNightLight: true,
    supportsBackgroundLight: false,
    supportsColor: false,
  },
  ceilc: {
    modelName: 'Arwen Ceiling Light 550C',
    supportsColorTemperature: { min: 2700, max: 6500 },
    supportsNightLight: true,
    supportsBackgroundLight: true,
    supportsColor: false,
  },
  lamp15: {
    modelName: 'Monitor Hanging Light',
    supportsColorTemperature: { min: 2700, max: 6500 },
    supportsNightLight: true,
    supportsBackgroundLight: true,
    supportsColor: false,
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
    supportsColorTemperature: support?.includes('set_ct_abx')
      ? { min: 2700, max: 2700 }
      : false,
    supportsColor: Boolean(support?.includes('set_hsv')),
    supportsBackgroundLight: Boolean(support?.includes('bg_set_hsv')),
    supportsNightLight: false,
  }
}
