import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { isGoogleOAuthConfigured } from '../google.strategy';

@Injectable()
export class GoogleAuthGuard
  extends AuthGuard('google')
  implements CanActivate
{
  constructor(private readonly configService: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    if (!isGoogleOAuthConfigured(this.configService)) {
      throw new ServiceUnavailableException({
        statusCode: 503,
        error: true,
        message:
          'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable it.',
      });
    }
    return super.canActivate(context);
  }
}
