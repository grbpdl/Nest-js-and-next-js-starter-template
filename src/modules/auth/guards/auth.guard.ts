import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { extractAccessToken } from '../utils/extract-access-token';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const accessToken = extractAccessToken(request);

    if (!accessToken) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        error: true,
        message: 'Unauthorized — provide access_token cookie or Bearer token',
      });
    }

    const user = await this.authService.validateToken(accessToken);

    if (!user) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        error: true,
        message: 'Unauthorized',
      });
    }

    request.user = user;
    return true;
  }
}
