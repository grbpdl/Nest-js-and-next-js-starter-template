import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { permissionSeed } from 'src/infra/database/seed/permission.seed';
import { getPermissionsForRole } from 'src/infra/database/seed/role-permission.seed';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from 'src/modules/user/entities/user.entity';
import { v7 as uuid } from 'uuid';
import { Role } from 'src/modules/role/entities/role.entity';
import { Permission } from 'src/modules/permission/entities/permission.entity';
import { BASE_APP_ROLES } from 'src/modules/role/entities/role.entity';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seedAdminUser() {
    let permissions = await this.permissionRepository.find();
    if (permissions.length === 0) {
      permissions = await this.permissionRepository.save(permissionSeed);
    } else {
      console.info(
        `Permissions already seeded (${permissions.length}), skipping.`,
      );
    }

    let superAdminRole = await this.roleRepository.findOne({
      where: { name: BASE_APP_ROLES.SUPER_ADMIN },
      relations: ['permissions'],
    });
    if (!superAdminRole) {
      superAdminRole = await this.roleRepository.save({
        id: uuid(),
        name: BASE_APP_ROLES.SUPER_ADMIN,
        permissions: getPermissionsForRole(
          BASE_APP_ROLES.SUPER_ADMIN,
          permissions,
        ),
      });
    }

    let adminRole = await this.roleRepository.findOne({
      where: { name: BASE_APP_ROLES.ADMIN },
    });
    if (!adminRole) {
      await this.roleRepository.save({
        id: uuid(),
        name: BASE_APP_ROLES.ADMIN,
        permissions: getPermissionsForRole(BASE_APP_ROLES.ADMIN, permissions),
      });
    }

    let userRole = await this.roleRepository.findOne({
      where: { name: BASE_APP_ROLES.USER },
    });
    if (!userRole) {
      await this.roleRepository.save({
        id: uuid(),
        name: BASE_APP_ROLES.USER,
        permissions: getPermissionsForRole(BASE_APP_ROLES.USER, permissions),
      });
    }

    const adminEmail = process.env.ADMIN_USER_EMAIL;
    const existingAdmin = adminEmail
      ? await this.userRepository.findOne({ where: { email: adminEmail } })
      : null;

    if (!existingAdmin) {
      const encryptPassword = (password: string): string => {
        return bcrypt.hashSync(password, 10);
      };

      await this.userRepository.save({
        id: uuid(),
        firstName: 'Super',
        lastName: 'Admin',
        email: adminEmail,
        isEmailVerified: true,
        phone: process.env.ADMIN_USER_PHONE,
        isPhoneVerified: true,
        password: encryptPassword(process.env.ADMIN_USER_PASSWORD),
        address: '',
        dateOfBirth: null,
        roles: [superAdminRole],
        gender: 'male',
      });
      console.info('Admin user seeded.');
    } else {
      console.info('Admin user already exists, skipping.');
    }
  }
}
