import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeviceInfoDto } from 'src/modules/device/entities/user-device.entity';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address or phone number',
  })
  @IsNotEmpty()
  emailOrPhone: string;

  @ApiProperty({ example: 'Password@123', format: 'password' })
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({
    example: 'device-abc-123',
    description: 'Client-generated device id (recommended for multi-device + FCM)',
  })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({
    example: 'fcm-token-from-firebase',
    description: 'FCM token for mobile push notifications',
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
