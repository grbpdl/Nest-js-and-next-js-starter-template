import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import EnvironmentConfiguration from 'src/config/env.config';

@Injectable()
export class SparrowSmsService {
  private readonly logger = new Logger(SparrowSmsService.name);
  private readonly apiUrl = 'https://api.sparrowsms.com/v2/sms/';

  /**
   * Sparrow expects a 10-digit Nepali mobile number (e.g. 98xxxxxxxx).
   * Strips +977 / 977 prefixes when present.
   */
  normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return digits;
    if (digits.length === 13 && digits.startsWith('977')) {
      return digits.slice(3);
    }
    if (digits.length === 12 && digits.startsWith('977')) {
      return digits.slice(3);
    }
    return digits.slice(-10);
  }

  async sendSms(to: string, text: string): Promise<void> {
    const { SPARROW_SMS_TOKEN, SPARROW_SMS_FROM } = EnvironmentConfiguration;

    if (!SPARROW_SMS_TOKEN || !SPARROW_SMS_FROM) {
      throw new InternalServerErrorException(
        'Sparrow SMS is not configured. Set SPARROW_SMS_TOKEN and SPARROW_SMS_FROM, or enable SMS_DEBUG.',
      );
    }

    const toNormalized = this.normalizePhone(to);
    if (toNormalized.length !== 10) {
      throw new InternalServerErrorException(
        'Invalid phone number for Sparrow SMS (expected 10-digit Nepal mobile)',
      );
    }

    const form = new URLSearchParams({
      token: SPARROW_SMS_TOKEN,
      from: SPARROW_SMS_FROM,
      to: toNormalized,
      text,
    });

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
      });

      const payload = (await response.json().catch(() => null)) as {
        response_code?: number;
        response?: string;
        count?: number;
      } | null;

      const code = payload?.response_code;
      if (!response.ok || (code !== undefined && code !== 200)) {
        this.logger.error(
          `Sparrow SMS error: HTTP ${response.status} ${JSON.stringify(payload)}`,
        );
        throw new InternalServerErrorException('Failed to send SMS');
      }
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      this.logger.error('Sparrow SMS request failed', error as Error);
      throw new InternalServerErrorException('Failed to send SMS');
    }
  }
}
