import { BaseAccessory } from '@homeiot/shared-homebridge'
import type { Platform } from './Platform'
import type { Device } from '@homeiot/xiaomi'
import type { PlatformAccessory } from 'homebridge'

export class Accessory extends BaseAccessory {
  constructor(
    platform: Platform,
    accessory: PlatformAccessory,
    public readonly device: Device,
  ) {
    super(platform, accessory)

    device
      .on('error', err => platform.log.error(err))
      .on('listening', () => platform.log.debug('[listening]', `${ device.host }:${ device.port }`))
      .on('request', data => platform.log.debug('[request]', data))
      .on('response', data => platform.log.debug('[response]', data))

    device
      .call('miIO.info')
      .catch(err => platform.log.error(err))
  }

  public save() {
    this.accessory.context = this.device.getAttributes()
    super.save()
  }
}
