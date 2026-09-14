import { Injectable } from '@nestjs/common';
import EnvironmentConfiguration from 'src/config/env.config';
import { DiscordWebhookService } from './discord-webhook.service';
import { TwilioSmsService } from './twilio-sms.service';

@Injectable()
export class SmsService {
  constructor(
    private readonly discordWebhookService: DiscordWebhookService,
    private readonly twilioSmsService: TwilioSmsService,
  ) {}

  async sendOtp(phone: string, code: string, purpose: string): Promise<void> {
    if (EnvironmentConfiguration.SMS_DEBUG) {
      await this.discordWebhookService.sendOtp(phone, code, purpose);
      return;
    }

    await this.twilioSmsService.sendSms(
      phone,
      `Your ${EnvironmentConfiguration.APP_NAME} verification code is ${code}`,
    );
  }
}
