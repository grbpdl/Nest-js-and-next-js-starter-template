import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';
import { existsSync } from 'fs';
import { join } from 'path';
import EnvironmentConfiguration from 'src/config/env.config';
import { MailService } from './mail.service';

function resolveMailTemplatesDir(): string {
  const nextToCompiled = join(__dirname, 'templates');
  if (existsSync(nextToCompiled)) {
    return nextToCompiled;
  }
  // nest start --watch / ts-node: templates live under src/
  return join(process.cwd(), 'src', 'infra', 'mail', 'templates');
}

function buildTransport() {
  const user = EnvironmentConfiguration.MAILER_EMAIL.trim();
  // Gmail app passwords are often pasted with spaces; SMTP expects 16 chars
  const pass = EnvironmentConfiguration.MAILER_PASSWORD.replace(/\s+/g, '');
  const host = EnvironmentConfiguration.MAILER_HOST.trim() || 'smtp.gmail.com';
  const port = EnvironmentConfiguration.MAILER_PORT || 465;

  if (!user || !pass) {
    return {
      jsonTransport: true,
    };
  }

  return {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    family: 4,
    tls: {
      rejectUnauthorized: false,
    },
  };
}

@Module({
  imports: [
    MailerModule.forRoot({
      transport: buildTransport(),
      defaults: {
        from: `"No Reply" <${EnvironmentConfiguration.MAILER_EMAIL || 'noreply@localhost'}>`,
      },
      template: {
        dir: resolveMailTemplatesDir(),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
