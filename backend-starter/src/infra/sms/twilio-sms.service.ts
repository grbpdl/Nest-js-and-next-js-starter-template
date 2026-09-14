import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import EnvironmentConfiguration from 'src/config/env.config';

@Injectable()
export class TwilioSmsService {
  private readonly logger = new Logger(TwilioSmsService.name);

  async sendSms(to: string, body: string): Promise<void> {
    const {
      TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN,
      TWILIO_FROM_NUMBER,
    } = EnvironmentConfiguration;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
      throw new InternalServerErrorException(
        'Twilio SMS is not configured. Set TWILIO_* env vars or enable SMS_DEBUG.',
      );
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const credentials = Buffer.from(
      `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`,
    ).toString('base64');

    const form = new URLSearchParams({
      To: to,
      From: TWILIO_FROM_NUMBER,
      Body: body,
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
      });

      if (!response.ok) {
        const text = await response.text();
        this.logger.error(`Twilio error: ${response.status} ${text}`);
        throw new InternalServerErrorException('Failed to send SMS');
      }
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      this.logger.error('Twilio request failed', error as Error);
      throw new InternalServerErrorException('Failed to send SMS');
    }
  }
}
