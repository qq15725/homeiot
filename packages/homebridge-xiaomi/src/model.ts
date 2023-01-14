import { defineBaseModel } from '@homeiot/shared-homebridge'
import type { ModelExport } from '@homeiot/shared-homebridge'
import type { Device } from '@homeiot/xiaomi'

export function defineModel(model: ModelExport<Device>): ModelExport<Device> {
  return defineBaseModel(model)
}

export function createSharedModelServices(env: any) {
  const { api, device } = env

  const {
    AccessoryInformation,
  } = api.hap.Service

  const {
    Manufacturer,
    Model,
    Name,
    SerialNumber,
    FirmwareRevision,
  } = api.hap.Characteristic

  return [
    {
      uuid: AccessoryInformation,
      characteristics: [
        { uuid: Manufacturer, value: device.get('device-information:manufacturer') },
        { uuid: Model, value: device.get('device-information:model') },
        { uuid: Name, value: device.get('device-information:name') || device.get('name') },
        { uuid: SerialNumber, value: device.get('device-information:serial-number') },
        { uuid: FirmwareRevision, value: device.get('device-information:firmware-revision') },
      ],
    },
  ]
}
