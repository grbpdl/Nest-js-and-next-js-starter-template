import {
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';

import { UserService } from 'src/modules/user/user.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { PermissionService } from '../permission/permission.service';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private readonly permissionService: PermissionService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    const role = new Role();
    role.name = createRoleDto.name;
    if (createRoleDto.permissions) {
      const permissionIds = createRoleDto.permissions.map(
        (permission) => permission.id,
      );
      role.permissions = await this.permissionService.findByIds(permissionIds);
    } else {
      role.permissions = [];
    }
    return await this.roleRepository.save(role);
  }

  async findAll() {
    return await this.roleRepository.find();
  }

  async findOneWithPermissions(id: string) {
    return await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });
  }

  async findOne(id: string) {
    return await this.roleRepository.findOne({
      where: { id },
    });
  }

  async findOneByName(id: string) {
    return await this.roleRepository.findOne({
      where: { name: id },
    });
  }

  async findByNameOrCreate(name: string) {
    let role = await this.findOneByName(name);
    if (!role) {
      const createRoleDto = { name, permissions: [] };
      role = await this.create(createRoleDto);
    }
    return role;
  }

  async update(role: Role, updateRoleDto: UpdateRoleDto) {
    if (updateRoleDto.name) {
      role.name = updateRoleDto.name;
    }
    if (updateRoleDto.permissions) {
      const permissionIds = updateRoleDto.permissions.map(
        (permission) => permission.id,
      );
      role.permissions = await this.permissionService.findByIds(permissionIds);
    }
    return await this.roleRepository.save(role);
  }

  async remove(id: string) {
    return await this.roleRepository.delete(id);
  }

  async assignRolesToUser(assignRoleDto: AssignRoleDto) {
    const user = await this.userService.findOne(assignRoleDto.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const roles = await Promise.all(
      assignRoleDto.roleIds.map((roleId) => this.findOne(roleId)),
    );

    const validRoles = roles.filter((role) => role !== null);
    if (validRoles.length === 0) {
      throw new NotFoundException('No valid roles found');
    }

    return await this.userService.updateRoles(user.id, validRoles);
  }

  async revokeRolesFromUser(userId: string, roleIds: string[]) {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const remainingRoles = user.roles.filter(
      (role) => !roleIds.includes(role.id),
    );
    return await this.userService.updateRoles(user.id, remainingRoles);
  }

  async addPermissionsToRole(roleId: string, permissionIds: string[]) {
    const role = await this.findOne(roleId);
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const permissions = await this.permissionService.findByIds(permissionIds);
    if (permissions.length === 0) {
      throw new NotFoundException('No valid permissions found');
    }

    role.permissions = [...role.permissions, ...permissions];
    return await this.roleRepository.save(role);
  }

  async removePermissionsFromRole(roleId: string, permissionIds: string[]) {
    const role = await this.findOne(roleId);
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    role.permissions = role.permissions.filter(
      (permission) => !permissionIds.includes(permission.id),
    );
    return await this.roleRepository.save(role);
  }
}
