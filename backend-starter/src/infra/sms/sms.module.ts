import { Module } from '@nestjs/common';
import { DiscordWebhookService } from './discord-webhook.service';
import { TwilioSmsService } from './twilio-sms.service';
import { SmsService } from './sms.service';

@Module({
  providers: [DiscordWebhookService, TwilioSmsService, SmsService],
  exports: [SmsService],
})
export class SmsModule {}
