import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/shared/utils/Helper';
import { User } from 'src/modules/user/entities/user.entity';
import { DevicePlatform } from '../enums/device-platform.enum';

@Entity('user_device')
@Index('IDX_user_device_user_device', ['userId', 'deviceId'], { unique: true })
@Index('IDX_user_device_fcm_token', ['fcmToken'])
export class UserDevice extends BaseEntity {
  @ApiProperty({ format: 'uuid' })
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.devices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @ApiProperty({
    example: 'browser-uuid-or-mobile-install-id',
    description: 'Client-generated stable device identifier',
  })
  @Column()
  deviceId: string;

  @ApiPropertyOptional({ enum: DevicePlatform })
  @Column({ type: 'enum', enum: DevicePlatform, nullable: true })
  platform?: DevicePlatform;

  @ApiPropertyOptional({ example: '192.168.1.10' })
  @Column({ nullable: true })
  ipAddress?: string;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  model?: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  manufacturer?: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  osVersion?: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  appVersion?: string;

  @ApiPropertyOptional({
    description: 'FCM push token for mobile; cleared on logout',
  })
  @Column({ type: 'text', nullable: true })
  fcmToken?: string | null;

  @ApiProperty()
  @Column({ default: true })
  isActive: boolean;

  @ApiPropertyOptional()
  @Column({ type: 'timestamptz', nullable: true })
  lastSeenAt?: Date;

  constructor(partial?: Partial<UserDevice>) {
    super();
    if (partial) Object.assign(this, partial);
  }
}

export class DeviceInfoDto {
  @ApiPropertyOptional({ enum: DevicePlatform, example: DevicePlatform.ANDROID })
  @IsOptional()
  @IsEnum(DevicePlatform)
  platform?: DevicePlatform;

  @ApiPropertyOptional({ example: 'Pixel 8' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 'Google' })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional({ example: '14' })
  @IsOptional()
  @IsString()
  osVersion?: string;

  @ApiPropertyOptional({ example: '1.0.0' })
  @IsOptional()
  @IsString()
  appVersion?: string;
}
