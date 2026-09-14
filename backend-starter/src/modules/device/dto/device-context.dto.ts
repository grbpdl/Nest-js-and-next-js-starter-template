import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { DeviceInfoDto } from '../entities/user-device.entity';

/** Shared device context sent from login / refresh / logout / FCM register. */
export class DeviceContextDto {
  @ApiProperty({
    example: 'device-abc-123',
    description: 'Stable client-generated device id',
  })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiPropertyOptional({
    example: 'fcm-token-from-firebase',
    description: 'Required for mobile push; omit on web',
  })
  @IsOptional()
  @IsString()
  fcmToken?: string;

  @ApiPropertyOptional({ type: DeviceInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeviceInfoDto)
  deviceInfo?: DeviceInfoDto;
}

export class RegisterFcmDto extends DeviceContextDto {
  @ApiProperty({ example: 'fcm-token-from-firebase' })
  @IsString()
  @IsNotEmpty()
  declare fcmToken: string;
}

export class LogoutDto {
  @ApiPropertyOptional({
    example: 'device-abc-123',
    description:
      'When provided, clears FCM for this device. When omitted, clears FCM on all devices (logout revokes all sessions).',
  })
  @IsOptional()
  @IsString()
  deviceId?: string;
}
