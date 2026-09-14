import { SetMetadata } from '@nestjs/common';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';

export const CheckOwnerOrRoles = (
  entity: EntityClassOrSchema,
  column: string,
  roles: string[],
) =>
  SetMetadata('checkOwnerOrRoles', {
    entity,
    column,
    roles,
  });
