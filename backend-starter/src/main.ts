import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerDocumentOptions,
} from '@nestjs/swagger';
import { handleValidationErrorMessage } from './shared/utils/Helper';

import helmet from 'helmet';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from './shared/exceptions/http-exception.filter';
import EnvironmentConfiguration from './config/env.config';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      origin: process.env.ORIGIN,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 200,
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['Set-Cookie'],
    },
  });

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    }),
  );

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      exceptionFactory(errors) {
        return handleValidationErrorMessage(errors);
      },
    }),
  );
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  const config = new DocumentBuilder()
    .setTitle(process.env.APP_TITLE || 'Starter API')
    .setDescription(
      [
        process.env.APP_DESCRIPTION || 'REST Auth + Media starter API',
        '',
        '## Auth',
        'Supports **access + refresh** tokens for browsers and mobile:',
        '- **Browser**: login sets httpOnly `access_token` and `refresh_token` cookies (`credentials: include`).',
        '- **Mobile**: login returns `data.access_token` and `data.refresh_token`. Send access as `Authorization: Bearer <access_token>`.',
        '- Refresh via `POST /auth/refresh` (cookie, body `refresh_token`, or `X-Refresh-Token` header).',
        '- Logout clears cookies and revokes sessions (`tokenVersion`).',
        'In Swagger UI use **Authorize** → cookie and/or bearer (access token).',
        '',
        '## OTP delivery',
        '- Email OTPs always go through SMTP (`MAILER_*`).',
        '- Phone OTPs go to Discord when `SMS_DEBUG=true`, otherwise Twilio.',
        '',
        '## Media',
        '`STORAGE_TYPE=local` serves files from `/uploads`. `STORAGE_TYPE=cloud` uses DigitalOcean Spaces.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addCookieAuth('access_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'access_token',
      description: 'Short-lived access JWT cookie for browsers',
    })
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Access JWT for mobile/API clients (from login `data.access_token`)',
      },
      'bearer',
    )
    .addTag('App', 'Health / welcome')
    .addTag('Auth', 'Register, login, Google OAuth, password reset')
    .addTag('OTP', 'Send, verify, and resend email/phone OTPs')
    .addTag('User', 'User CRUD (RBAC + owner checks)')
    .addTag('Role', 'Roles and role-permission assignment')
    .addTag('Permission', 'Permission CRUD')
    .addTag('Device', 'Multi-device sessions, IP/platform, FCM tokens')
    .addTag('Media', 'Upload and manage files (local or Spaces)')
    .addTag('Files', 'Resolve media access URLs')
    .build();

  if (EnvironmentConfiguration.STORAGE_TYPE === 'local') {
    const uploadDir = EnvironmentConfiguration.UPLOAD_DIR_LOCAL;
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    app.useStaticAssets(uploadDir, { prefix: '/uploads' });
  }

  const options: SwaggerDocumentOptions = {
    operationIdFactory: (_controllerKey: string, methodKey: string) =>
      methodKey,
  };
  const document = SwaggerModule.createDocument(app, config, options);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: `${process.env.APP_TITLE || 'Starter API'} Docs`,
  });

  app.useGlobalFilters(new HttpExceptionFilter());
  const PORT = process.env.PORT ?? 3000;
  await app.listen(PORT);
  console.info(
    `Application is running on ${process.env.NODE_ENV} on: ${await app.getUrl()}`,
  );
  console.info(`Swagger docs: ${await app.getUrl()}/api`);
}
bootstrap();
