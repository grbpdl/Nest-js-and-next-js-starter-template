import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { UserDevice, DeviceInfoDto } from './entities/user-device.entity';
import { DevicePlatform } from './enums/device-platform.enum';

export type UpsertDeviceInput = {
  userId: string;
  deviceId: string;
  ipAddress?: string;
  userAgent?: string;
  fcmToken?: string | null;
  deviceInfo?: DeviceInfoDto;
  /** When true, clears fcmToken even if undefined was passed */
  clearFcm?: boolean;
};

@Injectable()
export class DeviceService {
  constructor(
    @InjectRepository(UserDevice)
    private readonly deviceRepository: Repository<UserDevice>,
  ) {}

  async upsertDevice(input: UpsertDeviceInput): Promise<UserDevice> {
    let device = await this.deviceRepository.findOne({
      where: { userId: input.userId, deviceId: input.deviceId },
    });

    const info = input.deviceInfo ?? {};
    const now = new Date();

    if (!device) {
      device = this.deviceRepository.create({
        userId: input.userId,
        deviceId: input.deviceId,
        platform: info.platform ?? DevicePlatform.OTHER,
        model: info.model,
        manufacturer: info.manufacturer,
        osVersion: info.osVersion,
        appVersion: info.appVersion,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        fcmToken: input.clearFcm ? null : input.fcmToken ?? null,
        isActive: true,
        lastSeenAt: now,
      });
    } else {
      device.platform = info.platform ?? device.platform;
      device.model = info.model ?? device.model;
      device.manufacturer = info.manufacturer ?? device.manufacturer;
      device.osVersion = info.osVersion ?? device.osVersion;
      device.appVersion = info.appVersion ?? device.appVersion;
      if (input.ipAddress) device.ipAddress = input.ipAddress;
      if (input.userAgent) device.userAgent = input.userAgent;
      if (input.clearFcm) {
        device.fcmToken = null;
      } else if (input.fcmToken !== undefined) {
        device.fcmToken = input.fcmToken;
      }
      device.isActive = true;
      device.lastSeenAt = now;
    }

    return this.deviceRepository.save(device);
  }

  async listForUser(userId: string): Promise<UserDevice[]> {
    return this.deviceRepository.find({
      where: { userId },
      order: { lastSeenAt: 'DESC', createdAt: 'DESC' },
    });
  }

  async clearFcmForDevice(userId: string, deviceId: string): Promise<void> {
    const device = await this.deviceRepository.findOne({
      where: { userId, deviceId },
    });
    if (!device) return;
    device.fcmToken = null;
    device.isActive = false;
    device.lastSeenAt = new Date();
    await this.deviceRepository.save(device);
  }

  async clearAllFcmForUser(userId: string): Promise<void> {
    await this.deviceRepository.update(
      { userId },
      { fcmToken: null, isActive: false, lastSeenAt: new Date() },
    );
  }

  async removeDevice(userId: string, deviceId: string): Promise<void> {
    const result = await this.deviceRepository.delete({ userId, deviceId });
    if (!result.affected) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        error: true,
        message: 'Device not found',
      });
    }
  }

  async getActiveFcmTokens(userId: string): Promise<string[]> {
    const devices = await this.deviceRepository.find({
      where: { userId, isActive: true, fcmToken: Not(IsNull()) },
      select: ['fcmToken'],
    });
    return devices
      .map((d) => d.fcmToken)
      .filter((t): t is string => Boolean(t));
  }
}
