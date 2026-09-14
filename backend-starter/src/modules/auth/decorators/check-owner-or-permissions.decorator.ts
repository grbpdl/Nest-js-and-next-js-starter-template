import { SetMetadata } from '@nestjs/common';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';

export const CheckOwnerOrPermissions = (
  entity: EntityClassOrSchema,
  column: string,
  permissions: string[],
) =>
  SetMetadata('checkOwnerOrPermissions', {
    entity,
    column,
    permissions,
  });
