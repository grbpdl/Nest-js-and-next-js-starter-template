import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendMail(to: string, subject: string, name: string, code: string) {
    try {
      await this.mailerService.sendMail({
        to: to,
        from: `"${process.env.APP_NAME}" <${process.env.MAILER_EMAIL}>`,
        subject: subject,
        template: 'confirmation',
        context: {
          name,
          code,
        },
      });
    } catch (error) {
      console.error('DEBUG:::error:::mailer:::', error);
    }
  }
}
