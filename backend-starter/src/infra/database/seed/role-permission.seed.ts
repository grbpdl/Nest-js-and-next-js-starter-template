import {
  PermissionActions,
  PermissionEntities,
} from 'src/modules/permission/entities/permission.entity';
import { BASE_APP_ROLES } from 'src/modules/role/entities/role.entity';
import { Permission } from 'src/modules/permission/entities/permission.entity';

export const ROLE_PERMISSION_RECORD: Record<
  string,
  { entity: PermissionEntities; action: PermissionActions }[]
> = {
  [BASE_APP_ROLES.ADMIN]: [
    { entity: PermissionEntities.USER, action: PermissionActions.CREATE },
    { entity: PermissionEntities.USER, action: PermissionActions.READ },
    { entity: PermissionEntities.USER, action: PermissionActions.UPDATE },
    { entity: PermissionEntities.USER, action: PermissionActions.DELETE },
    { entity: PermissionEntities.ROLE, action: PermissionActions.READ },
    { entity: PermissionEntities.ROLE, action: PermissionActions.UPDATE },
    { entity: PermissionEntities.ROLE, action: PermissionActions.UPDATE_STATUS },
    { entity: PermissionEntities.PERMISSION, action: PermissionActions.READ },
    { entity: PermissionEntities.MEDIA, action: PermissionActions.CREATE },
    { entity: PermissionEntities.MEDIA, action: PermissionActions.READ },
    { entity: PermissionEntities.MEDIA, action: PermissionActions.UPDATE },
    { entity: PermissionEntities.MEDIA, action: PermissionActions.DELETE },
  ],
  [BASE_APP_ROLES.USER]: [
    { entity: PermissionEntities.USER, action: PermissionActions.READ },
    { entity: PermissionEntities.MEDIA, action: PermissionActions.CREATE },
    { entity: PermissionEntities.MEDIA, action: PermissionActions.READ },
    { entity: PermissionEntities.MEDIA, action: PermissionActions.DELETE },
  ],
};

export function getPermissionsForRole(
  roleName: string,
  allPermissions: Permission[],
): Permission[] {
  if (roleName === BASE_APP_ROLES.SUPER_ADMIN) {
    return allPermissions;
  }
  const record = ROLE_PERMISSION_RECORD[roleName];
  if (!record || record.length === 0) {
    return [];
  }
  const set = new Set(record.map((r) => `${r.entity}:${r.action}`));
  return allPermissions.filter((p) =>
    set.has(`${p.entity}:${p.action}`),
  ) as Permission[];
}
