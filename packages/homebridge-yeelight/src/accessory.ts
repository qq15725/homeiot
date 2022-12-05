import { PLATFORM_NAME } from './constants'
import type { Device } from '@homeiot/yeelight'
import type { Characteristic, PlatformAccessory } from 'homebridge'
import type { YeelightPlatform } from './platform'

const nameCount = new Map<string, number>()

export async function setupAccessory(
  platform: YeelightPlatform,
  accessory: PlatformAccessory,
  device: Device,
) {
  const { Service, Characteristic } = platform.api.hap
  const info = device.info
  let name = device.spec.name
  let count = nameCount.get(name) || 0
  count = count + 1
  nameCount.set(name, count)
  if (count > 1) {
    name = `${ name } ${ count }`
  }

  // setup accessory information
  (accessory.getService(Service.AccessoryInformation)
    ?? accessory.addService(new Service.AccessoryInformation()))
    ?.updateCharacteristic(Characteristic.Manufacturer, PLATFORM_NAME)
    .updateCharacteristic(Characteristic.Model, device.spec.name)
    .updateCharacteristic(Characteristic.Name, name)
    .updateCharacteristic(Characteristic.SerialNumber, info.id)
    .updateCharacteristic(Characteristic.FirmwareRevision, info.fwVer)
    // .getCharacteristic(Characteristic.ConfiguredName)
    // .on('set', (value, callback) => {
  // device.name = this.displayName = value.toString()
  // this.setCharacteristic(Characteristic.Name, value)
  // for (const service of this.services) {
  //   service.updateName(value.toString())
  // }
  // this.platform.api.updatePlatformAccessories([this.accessory])
  // callback()
    // })

  function on(
    characteristic: Characteristic,
    getter: () => any,
    setter: (value: any) => any,
  ) {
    characteristic.on('get', async callback => {
      try {
        callback(0, await getter())
      } catch (e: any) {
        callback(e)
      }
    })
    characteristic.on('set', async (value, callback) => {
      try {
        await setter(value)
        callback(0)
      } catch (e: any) {
        callback(e)
      }
    })
    return characteristic
  }

  device.on('command', (cmd: string) => platform.log(cmd))

  const lightbulb = accessory.getService(Service.Lightbulb)
    ?? accessory.addService(new Service.Lightbulb(name))

  on(
    lightbulb.getCharacteristic(Characteristic.On),
    async () => {
      const res = await device.getProp('power')
      return res === 'on'
    },
    (v) => device.setPower(v ? 'on' : 'off'),
  )

  if (device.spec.color) {
    on(
      lightbulb.getCharacteristic(Characteristic.Hue),
      async () => Number(await device.getProp('hue')) || 0,
      async v => device.setHsv(v, Number(await device.getProp('sat')) || 100),
    )

    on(
      lightbulb.getCharacteristic(Characteristic.Saturation),
      async () => Number(await device.getProp('sat')) || 100,
      async v => device.setHsv(Number(await device.getProp('hue')) || 0, v),
    )
  }
}
