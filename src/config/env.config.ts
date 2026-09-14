import * as path from 'path';
import { config as loadEnv } from 'dotenv';

loadEnv();

function env(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  return value ?? '';
}

function envBool(key: string, fallback = false): boolean {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
}

const EnvironmentConfiguration = {
  NODE_ENV: env('NODE_ENV', 'development'),
  PORT: Number(env('PORT', '3000')),
  ORIGIN: env('ORIGIN', 'http://localhost:3000'),
  BASE_URL: env('BASE_URL', 'http://localhost:3000'),
  APP_NAME: env('APP_NAME', 'starter-api'),

  JWT_SECRET: env('JWT_SECRET'),
  JWT_ACCESS_EXPIRATION: env('JWT_ACCESS_EXPIRATION', env('JWT_EXPIRATION', '15m')),
  JWT_REFRESH_SECRET: env('JWT_REFRESH_SECRET', env('JWT_SECRET')),
  JWT_REFRESH_EXPIRATION: env('JWT_REFRESH_EXPIRATION', '7d'),

  GOOGLE_CLIENT_ID: env('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: env('GOOGLE_CLIENT_SECRET'),
  GOOGLE_CALLBACK_URL: env('GOOGLE_CALLBACK_URL'),

  MAILER_HOST: env('MAILER_HOST'),
  MAILER_PORT: Number(env('MAILER_PORT', '465')),
  MAILER_EMAIL: env('MAILER_EMAIL'),
  MAILER_PASSWORD: env('MAILER_PASSWORD'),

  SMS_DEBUG: envBool('SMS_DEBUG', true),
  DISCORD_WEBHOOK_URL: env('DISCORD_WEBHOOK_URL'),

  TWILIO_ACCOUNT_SID: env('TWILIO_ACCOUNT_SID'),
  TWILIO_AUTH_TOKEN: env('TWILIO_AUTH_TOKEN'),
  TWILIO_FROM_NUMBER: env('TWILIO_FROM_NUMBER'),

  STORAGE_TYPE: (env('STORAGE_TYPE', 'local') === 'cloud'
    ? 'cloud'
    : 'local') as 'local' | 'cloud',
  UPLOAD_DIR_LOCAL: path.resolve(
    process.cwd(),
    env('UPLOAD_DIR_LOCAL', './uploads'),
  ),
  UPLOAD_DIR_CLOUD: env('UPLOAD_DIR_CLOUD', 'uploads').replace(/^\/+|\/+$/g, ''),

  DO_SPACES_ENDPOINT: env('DO_SPACES_ENDPOINT'),
  DO_SPACES_REGION: env('DO_SPACES_REGION'),
  DO_SPACES_BUCKET: env('DO_SPACES_BUCKET'),
  DO_SPACES_ACCESS_KEY_ID: env('DO_SPACES_ACCESS_KEY_ID'),
  DO_SPACES_SECRET_ACCESS_KEY: env('DO_SPACES_SECRET_ACCESS_KEY'),
  DO_SPACES_CDN_URL: env('DO_SPACES_CDN_URL'),
  DO_SPACES_SIGNED_URL_EXPIRES: Number(
    env('DO_SPACES_SIGNED_URL_EXPIRES', '300'),
  ),
};

export default EnvironmentConfiguration;
