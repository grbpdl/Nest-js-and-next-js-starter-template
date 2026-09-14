import { SetMetadata } from '@nestjs/common';

export const REQUIRED_ROLES_KEY = 'required_roles';
export const ALLOWED_ROLES_KEY = 'allowed_roles';

export const RequiredRoles = (...roles: string[]) =>
  SetMetadata(REQUIRED_ROLES_KEY, roles);

export const AllowedRoles = (...roles: string[]) =>
  SetMetadata(ALLOWED_ROLES_KEY, roles);
