import { Injectable, Logger } from '@nestjs/common';
import EnvironmentConfiguration from 'src/config/env.config';

@Injectable()
export class DiscordWebhookService {
  private readonly logger = new Logger(DiscordWebhookService.name);

  async sendOtp(destination: string, code: string, purpose: string) {
    const webhookUrl = EnvironmentConfiguration.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      this.logger.warn(
        `DISCORD_WEBHOOK_URL missing; OTP for ${destination}: ${code}`,
      );
      return;
    }

    const content = [
      '**OTP (SMS_DEBUG)**',
      `Purpose: \`${purpose}\``,
      `To: \`${destination}\``,
      `Code: \`${code}\``,
    ].join('\n');

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) {
        this.logger.error(
          `Discord webhook failed: HTTP ${response.status}`,
        );
      }
    } catch (error) {
      this.logger.error('Discord webhook request failed', error as Error);
    }
  }
}
