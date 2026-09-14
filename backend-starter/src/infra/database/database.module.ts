import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

import { User } from 'src/modules/user/entities/user.entity';
import { Role } from 'src/modules/role/entities/role.entity';
import { Permission } from 'src/modules/permission/entities/permission.entity';
import { Otp } from 'src/modules/common/otp/entities/otp.entity';
import { Media } from 'src/modules/common/media/entities/media.entity';
import { UserDevice } from 'src/modules/device/entities/user-device.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow('POSTGRES_HOST'),
        port: configService.getOrThrow('POSTGRES_PORT'),
        username: configService.getOrThrow('POSTGRES_USER'),
        password: configService.getOrThrow('POSTGRES_PASSWORD'),
        database: configService.getOrThrow('POSTGRES_DB'),
        entities: [User, Role, Permission, Otp, Media, UserDevice],
        logging: true,
        synchronize:
          configService.get('NODE_ENV') === 'development' ? true : false,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
