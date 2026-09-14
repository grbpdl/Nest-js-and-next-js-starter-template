import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from 'src/modules/user/entities/user.entity';
import { SeedService } from './seed.service';
import { Role } from 'src/modules/role/entities/role.entity';
import { Permission } from 'src/modules/permission/entities/permission.entity';
import { Otp } from 'src/modules/common/otp/entities/otp.entity';
import { Media } from 'src/modules/common/media/entities/media.entity';
import { UserDevice } from 'src/modules/device/entities/user-device.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      entities: [User, Role, Permission, Otp, Media, UserDevice],
      synchronize: true,
      logging: true,
    }),
    TypeOrmModule.forFeature([Role, Permission, User]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedAppModule {}
