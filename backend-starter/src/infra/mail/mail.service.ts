import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import EnvironmentConfiguration from 'src/config/env.config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private mailerService: MailerService) {}

  private get hasSmtpCredentials(): boolean {
    return Boolean(
      EnvironmentConfiguration.MAILER_EMAIL?.trim() &&
        EnvironmentConfiguration.MAILER_PASSWORD?.replace(/\s+/g, ''),
    );
  }

  async sendMail(to: string, subject: string, name: string, code: string) {
    if (!this.hasSmtpCredentials) {
      this.logger.warn(
        `MAILER_EMAIL/PASSWORD missing; OTP for ${to}: ${code}`,
      );
      return;
    }

    const from = `"${EnvironmentConfiguration.APP_NAME || 'Starter'}" <${EnvironmentConfiguration.MAILER_EMAIL}>`;

    try {
      await this.mailerService.sendMail({
        to,
        from,
        subject,
        template: 'confirmation',
        context: {
          name,
          code,
        },
      });
      return;
    } catch (error) {
      this.logger.warn(
        `Template mail failed, falling back to HTML: ${(error as Error)?.message}`,
      );
    }

    try {
      await this.mailerService.sendMail({
        to,
        from,
        subject,
        html: `
          <p>Hi ${name || 'there'},</p>
          <p>Your verification code is <strong>${code}</strong>.</p>
          <p>If you did not request this, you can ignore this email.</p>
        `,
        text: `Hi ${name || 'there'}, your verification code is ${code}.`,
      });
    } catch (error) {
      this.logger.error('Failed to send email', error as Error);
      this.logger.warn(`OTP fallback log for ${to}: ${code}`);
    }
  }
}
