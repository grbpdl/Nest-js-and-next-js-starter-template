import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  HttpStatus,
} from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { BASE_APP_ROLES } from 'src/modules/role/entities/role.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CheckOwnerOrPermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private moduleRef: ModuleRef,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const hasCondition = this.reflector.get<{
      entity: EntityClassOrSchema;
      column: string;
      permissions: string[];
    }>('checkOwnerOrPermissions', context.getHandler());

    if (!hasCondition) {
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

    const hasPermission = await this.hasPermission(
      user,
      hasCondition.permissions,
    );

    if (hasPermission) {
      return true;
    }

    const checkIsOwner = await this.isOwner(
      hasCondition.entity,
      request.params.id,
      user.id,
      hasCondition.column,
    );

    if (checkIsOwner) {
      return true;
    }

    throw new UnauthorizedException({
      statusCode: HttpStatus.UNAUTHORIZED,
      error: true,
      message: 'Unauthorized - Insufficient permissions',
    });
  }

  private async isOwner(
    entity: EntityClassOrSchema,
    entityId: string,
    userId: string,
    column: string,
  ): Promise<boolean> {
    const repository = this.moduleRef.get<Repository<any>>(
      getRepositoryToken(entity),
      { strict: false },
    );

    const entityInstance = await repository.findOne({
      where: { id: entityId },
    });

    if (!entityInstance) {
      return false;
    }

    const columnPath = column.split('.');
    let value = entityInstance;
    for (const key of columnPath) {
      value = value[key];
      if (value === undefined) {
        return false;
      }
    }

    return value === userId;
  }

  private async hasPermission(
    user: User,
    requiredPermissions: string[],
  ): Promise<boolean> {
    const userPermissions = new Set<string>();

    user.roles.forEach((role) => {
      role.permissions.forEach((permission) => {
        userPermissions.add(`${permission.action}:${permission.entity}`);
      });
    });

    return requiredPermissions.every((permission) =>
      userPermissions.has(permission),
    );
  }
}
