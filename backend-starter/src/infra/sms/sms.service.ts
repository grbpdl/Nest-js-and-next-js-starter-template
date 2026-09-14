import { Injectable } from '@nestjs/common';
import EnvironmentConfiguration from 'src/config/env.config';
import { DiscordWebhookService } from './discord-webhook.service';
import { SparrowSmsService } from './sparrow-sms.service';

@Injectable()
export class SmsService {
  constructor(
    private readonly discordWebhookService: DiscordWebhookService,
    private readonly sparrowSmsService: SparrowSmsService,
  ) {}

  async sendOtp(phone: string, code: string, purpose: string): Promise<void> {
    if (EnvironmentConfiguration.SMS_DEBUG) {
      await this.discordWebhookService.sendOtp(phone, code, purpose);
      return;
    }

    await this.sparrowSmsService.sendSms(
      phone,
      `Your ${EnvironmentConfiguration.APP_NAME} verification code is ${code}`,
    );
  }
}
