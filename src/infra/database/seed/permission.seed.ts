import {
  Permission,
  PermissionActions,
  PermissionEntities,
} from 'src/modules/permission/entities/permission.entity';

import { v7 as uuid } from 'uuid';

const entities = [
  PermissionEntities.USER,
  PermissionEntities.ROLE,
  PermissionEntities.PERMISSION,
  PermissionEntities.MEDIA,
];

const actions = [
  PermissionActions.CREATE,
  PermissionActions.READ,
  PermissionActions.UPDATE,
  PermissionActions.DELETE,
];

export const permissionSeed: Partial<Permission>[] = [
  ...entities.flatMap((entity) =>
    actions.map((action) => ({
      id: uuid(),
      action,
      entity,
    })),
  ),
  {
    id: uuid(),
    action: PermissionActions.UPDATE_STATUS,
    entity: PermissionEntities.ROLE,
  },
];
