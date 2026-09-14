import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';

import { User } from 'src/modules/user/entities/user.entity';
import { DatabaseModule } from '../database.module';
import { ConfigModule } from '@nestjs/config';
import { Role } from 'src/modules/role/entities/role.entity';
import { Permission } from 'src/modules/permission/entities/permission.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    TypeOrmModule.forFeature([Role, Permission, User]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
