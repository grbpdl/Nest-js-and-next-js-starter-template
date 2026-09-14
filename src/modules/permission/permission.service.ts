import { Injectable } from '@nestjs/common';
import { EntityManager, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { User } from 'src/modules/user/entities/user.entity';
import {
  Permission,
  PermissionActions,
  PermissionEntities,
} from './entities/permission.entity';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    private entityManager: EntityManager,
  ) {}

  async create(createPermissionDto: CreatePermissionDto) {
    return await this.permissionRepository.save(createPermissionDto);
  }

  async findAll() {
    return await this.permissionRepository.find();
  }

  async findByIds(ids: string[]) {
    return await this.permissionRepository.findBy({ id: In(ids) });
  }

  async findOneWithRoles(id: string) {
    return await this.permissionRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
  }

  async findOne(id: string) {
    return await this.permissionRepository.findOne({
      where: { id },
    });
  }

  async findOneWithActionEntity(
    action: PermissionActions,
    entity: PermissionEntities,
  ) {
    return await this.permissionRepository.findOne({
      where: { action, entity },
    });
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto) {
    await this.permissionRepository.update(id, updatePermissionDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    return await this.permissionRepository.delete(id);
  }

  async checkPermission(
    user: User,
    action: PermissionActions,
    entity: PermissionEntities,
  ): Promise<boolean> {
    // Get all permissions for the user's roles
    const userPermissions = await this.permissionRepository
      .createQueryBuilder('permission')
      .innerJoinAndSelect('permission.roles', 'role')
      .innerJoinAndSelect('role.users', 'user', 'user.id = :userId', {
        userId: user.id,
      })
      .where('permission.action = :action', { action })
      .andWhere('permission.entity = :entity', { entity })
      .getMany();

    return userPermissions.length > 0;
  }
}
