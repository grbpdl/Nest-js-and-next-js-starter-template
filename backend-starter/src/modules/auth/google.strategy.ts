import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

/** True when Google OAuth env vars are set. */
export function isGoogleOAuthConfigured(
  configService: ConfigService,
): boolean {
  const clientID = configService.get<string>('GOOGLE_CLIENT_ID')?.trim();
  const clientSecret = configService
    .get<string>('GOOGLE_CLIENT_SECRET')
    ?.trim();
  return Boolean(clientID && clientSecret);
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private readonly configService: ConfigService) {
    const configured = isGoogleOAuthConfigured(configService);
    // Passport requires non-empty clientID at construct time. Use placeholders
    // when Google OAuth is optional/unconfigured so the app can still boot.
    super({
      clientID: configured
        ? configService.get<string>('GOOGLE_CLIENT_ID')
        : 'google-oauth-not-configured',
      clientSecret: configured
        ? configService.get<string>('GOOGLE_CLIENT_SECRET')
        : 'google-oauth-not-configured',
      callbackURL:
        configService.get<string>('GOOGLE_CALLBACK_URL') ||
        'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });

    if (!configured) {
      this.logger.warn(
        'Google OAuth is disabled (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set). /auth/google will return 503.',
      );
    }
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    const user = {
      email: emails?.[0]?.value,
      firstName: name?.givenName,
      lastName: name?.familyName,
      picture: photos?.[0]?.value,
    };
    done(null, user);
  }
}
