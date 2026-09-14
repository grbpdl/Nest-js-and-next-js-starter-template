import { Role } from 'src/modules/role/entities/role.entity';
import { BaseEntity } from 'src/shared/utils/Helper';
import { Column, Entity, Index, ManyToMany } from 'typeorm';

export enum PermissionActions {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  UPDATE_STATUS = 'update_status',
}

export enum PermissionEntities {
  USER = 'user',
  ROLE = 'role',
  PERMISSION = 'permission',
  MEDIA = 'media',
}

@Entity('permission')
@Index('IDX_permission_action_entity', ['action', 'entity'], { unique: true })
export class Permission extends BaseEntity {
  @Column({
    type: 'enum',
    enum: PermissionActions,
  })
  action: PermissionActions;

  @Column({
    type: 'enum',
    enum: PermissionEntities,
  })
  entity: PermissionEntities;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
