import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { SeedAppModule } from './seed-app.module';
import { SeedService } from './seed.service';
import { ConfigService } from '@nestjs/config';

const seed = async function seed() {
  try {
    const app = await NestFactory.createApplicationContext(SeedAppModule, {
      logger: ['error', 'warn', 'log'],
    });
    const configService = app.get(ConfigService);
    const seedService = app.get(SeedService);
    // Verify required environment variables
    const requiredEnvVars = [
      'ADMIN_USER_EMAIL',
      'ADMIN_USER_PHONE',
      'ADMIN_USER_PASSWORD',
    ];
    for (const envVar of requiredEnvVars) {
      if (!configService.get(envVar)) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }
    await seedService.seedAdminUser();
    console.info('✅ Seeding completed successfully!');
    await app.close();
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
};

seed();
