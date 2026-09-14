import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { User } from 'src/modules/user/entities/user.entity';
import { ALLOWED_PERMISSIONS_KEY, REQUIRED_PERMISSIONS_KEY } from '../decorators/permission.decorator';
import { BASE_APP_ROLES } from 'src/modules/role/entities/role.entity';
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>(
      REQUIRED_PERMISSIONS_KEY,
      context.getHandler(),
    );

    const allowedPermissions = this.reflector.get<string[]>(
      ALLOWED_PERMISSIONS_KEY,
      context.getHandler(),
    );

    if (!requiredPermissions && !allowedPermissions) {
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

    const userPermissions = new Set<string>();

    user.roles.forEach((role) => {
      role.permissions.forEach((permission) => {
        userPermissions.add(`${permission.action}:${permission.entity}`);
      });
    });

    // Check if user has all required permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasRequiredPermission = requiredPermissions.every((permission) =>
        userPermissions.has(permission),
      );

      if (!hasRequiredPermission) {
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          error: true,
          message: 'Unauthorized - Insufficient permissions',
        });
      }
    }

    // Check if user has any allowed permissions
    if (allowedPermissions && allowedPermissions.length > 0) {
      const hasAllowedPermission = allowedPermissions.some((permission) =>
        userPermissions.has(permission),
      );
      if (!hasAllowedPermission) {
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          error: true,
          message: 'Unauthorized - Insufficient permissions',
        });
      }
    }

    return true;
  }
}
