import { Device } from '@homeiot/yeelight'
import type { PlatformContext } from './platform'
import type { DeviceInfo } from '@homeiot/yeelight'
import type { PlatformAccessory } from 'homebridge'

function convertColorTemperature(value: number): number {
  return Math.round(1_000_000 / value)
}

export async function configureAccessory(
  accessory: PlatformAccessory<DeviceInfo>,
  platformContext: PlatformContext,
  wasRecentlyCreated = false,
) {
  const { log, config, api, configured } = platformContext
  const { displayName, context: deviceInfo } = accessory
  const id = deviceInfo.id

  if (!id || configured.has(id)) {
    log.warn(`Ingnoring duplicate accessory ${ id } with name ${ displayName }`)
    return
  }

  configured.add(id)

  const { name: platformName } = config
  const device = new Device(deviceInfo)
  const name = device.displayName

  const prefix = `${ device.host }:${ device.port } ${ name }`

  device
    .on('error', err => log.error(err))
    .on('start', () => log.debug('[start]', prefix))
    .on('stop', () => log.debug('[stop]', prefix))
    .on('request', data => log.debug('[request]', prefix, data))
    .on('response', data => log.debug('[response]', prefix, data))

  if (wasRecentlyCreated) {
    log(`Initializing new accessory ${ id } with name ${ displayName }...`)
  } else {
    log(`Loading accessory from cache: ${ displayName }`)
  }

  try {
    await device.startCf('500, 2, 0, 10, 500, 2, 0, 100', 4)
  } catch (err: any) {
    log.error(err)
  }

  const { Service, Characteristic } = api.hap
  const { AccessoryInformation, Lightbulb } = Service

  const [
    accessoryInformation,
    lightbulb,
  ] = [
    AccessoryInformation,
    Lightbulb,
  ].map(Klass => (
    accessory.getService(Klass)
    || accessory.addService(new Klass())
  ))

  const {
    Manufacturer, Model, Name, SerialNumber, FirmwareRevision,
    On, Brightness, Hue, Saturation, ColorTemperature,
  } = Characteristic

  accessoryInformation.getCharacteristic(Manufacturer).updateValue(platformName ?? null)
  accessoryInformation.getCharacteristic(Model).updateValue(device.modelName ?? device.model ?? null)
  accessoryInformation.getCharacteristic(Name).updateValue(device.name ?? null)
  accessoryInformation.getCharacteristic(SerialNumber).updateValue(device.id ?? null)
  accessoryInformation.getCharacteristic(FirmwareRevision).updateValue(device.fwVer ?? null)

  lightbulb.getCharacteristic(On)
    .onGet(() => device.power === 'on')
    .onSet(val => {
      device.power = val ? 'on' : 'off'
    })

  lightbulb.getCharacteristic(Brightness)
    .onGet(() => device.bright ?? null)
    .onSet(val => {
      device.bright = Number(val)
    })

  if (device.supportColor) {
    lightbulb.getCharacteristic(Hue)
      .onGet(() => device.hue ?? null)
      .onSet(val => {
        device.hue = Number(val)
      })

    lightbulb.getCharacteristic(Saturation)
      .onGet(() => device.sat ?? null)
      .onSet(val => {
        device.set('sat', val)
      })
  }

  if (device.supportColorTemperature) {
    lightbulb.getCharacteristic(ColorTemperature)
      .onGet(() => device.ct ? convertColorTemperature(device.ct) : null)
      .onSet(val => {
        device.ct = convertColorTemperature(Number(val))
      })
      .setProps({
        maxValue: convertColorTemperature(device.supportColorTemperature.min),
        minValue: convertColorTemperature(device.supportColorTemperature.max),
      })
  }
}
