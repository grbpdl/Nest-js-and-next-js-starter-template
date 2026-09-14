import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { DatabaseModule } from './infra/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { MulterModule } from '@nestjs/platform-express';
import { SeedModule } from './infra/database/seed/seed.module';

import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { RedisModule } from './infra/redis/redis.module';
import { RoleModule } from './modules/role/role.module';
import { PermissionModule } from './modules/permission/permission.module';
import { OtpModule } from './modules/common/otp/otp.module';
import { MediaModule } from './modules/common/media/media.module';
import EnvironmentConfiguration from './config/env.config';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    RedisModule,
    DatabaseModule,
    UserModule,
    RoleModule,
    PermissionModule,
    AuthModule,
    OtpModule,
    MediaModule,
    SeedModule,
    MulterModule.register({
      dest: EnvironmentConfiguration.UPLOAD_DIR_LOCAL,
    }),
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }, AppService],
})
export class AppModule {}
