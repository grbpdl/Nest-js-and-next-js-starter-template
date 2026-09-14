import { Module } from '@nestjs/common';
import { DiscordWebhookService } from './discord-webhook.service';
import { SparrowSmsService } from './sparrow-sms.service';
import { SmsService } from './sms.service';

@Module({
  providers: [DiscordWebhookService, SparrowSmsService, SmsService],
  exports: [SmsService],
})
export class SmsModule {}
