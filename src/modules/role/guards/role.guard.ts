import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from 'src/modules/user/entities/user.entity';
import { ALLOWED_ROLES_KEY, REQUIRED_ROLES_KEY } from '../decorators/role.decorator';
import { BASE_APP_ROLES } from '../entities/role.entity';


@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string[]>(
      REQUIRED_ROLES_KEY,
      context.getHandler(),
    );

    const allowedRoles = this.reflector.get<string[]>(
      ALLOWED_ROLES_KEY,
      context.getHandler(),
    );

    if (!requiredRoles && !allowedRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        error: true,
        message: 'Unauthorized - User not found',
      });
    }

    // check if user is super admin user
    if (user.roles.some((role) => role.name === BASE_APP_ROLES.SUPER_ADMIN)) {
      return true;
    }

    // Check if user has all required roles
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRoles = requiredRoles.every((requiredRole) =>
        user.roles.some((role) => role.name === requiredRole),
      );
      if (!hasRequiredRoles) {
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          error: true,
          message: 'Unauthorized - Insufficient roles',
        });
      }
      return true;
    }

    // Check if user has any allowed roles
    if (allowedRoles && allowedRoles.length > 0) {
      const hasAllowedRoles = allowedRoles.some((allowedRole) =>
        user.roles.some((role) => role.name === allowedRole),
      );
      if (!hasAllowedRoles) {
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          error: true,
          message: 'Unauthorized - No allowed roles found',
        });
      }
    }

    return true;
  }
}
