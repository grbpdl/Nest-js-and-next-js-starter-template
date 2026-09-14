import { DataSource } from 'typeorm';
import { config as loadEnv } from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { User } from '../../modules/user/entities/user.entity';
import { Permission } from 'src/modules/permission/entities/permission.entity';
import { Role } from 'src/modules/role/entities/role.entity';
import { Otp } from 'src/modules/common/otp/entities/otp.entity';
import { Media } from 'src/modules/common/media/entities/media.entity';

loadEnv();

const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  host: configService.getOrThrow('POSTGRES_HOST'),
  port: Number(configService.getOrThrow('POSTGRES_PORT')),
  username: configService.getOrThrow('POSTGRES_USER'),
  password: configService.getOrThrow('POSTGRES_PASSWORD'),
  database: configService.getOrThrow('POSTGRES_DB'),
  entities: [User, Role, Permission, Otp, Media],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations',
});
