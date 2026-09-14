import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DeviceInfoDto } from 'src/modules/device/entities/user-device.entity';

export class RefreshTokenDto {
  @ApiPropertyOptional({
    description:
      'Refresh JWT for mobile clients. Browsers can omit this and rely on the `refresh_token` cookie.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  refresh_token?: string;

  @ApiPropertyOptional({ example: 'device-abc-123' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({ example: 'fcm-token-from-firebase' })
  @IsOptional()
  @IsString()
  fcmToken?: string;

  @ApiPropertyOptional({ type: DeviceInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeviceInfoDto)
  deviceInfo?: DeviceInfoDto;
}
