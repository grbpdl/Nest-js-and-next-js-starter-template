import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  private async encryptPassword(password: string) {
    return await bcrypt.hash(password, 10);
  }

  async saveUser(user: User): Promise<User> {
    return await this.userRepository.save(user);
  }

  async create(createUserDto: CreateUserDto) {
    createUserDto.password = await this.encryptPassword(createUserDto.password);
    const user = new User(createUserDto);
    const savedUser = await this.userRepository.save(user);
    return await this.findOne(savedUser.id);
  }

  async findAll() {
    return await this.userRepository.find({
      relations: ['roles'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByRoleName(roleName: string) {
    return await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .where('role.name = :roleName', { roleName })
      .orderBy('user.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string) {
    return await this.userRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
  }

  async findOneWithRolePermissions(id: string) {
    return await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions'],
    });
  }

  async findOneForMe(id: string) {
    return await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'isEmailVerified',
        'phone',
        'isPhoneVerified',
        'profilePicture',
        'address',
        'password',
        'dateOfBirth',
        'gender',
        'accountStatus',
        'tokenVersion',
      ],
      relations: ['roles', 'roles.permissions'],
    });
  }

  async findOneIncludingTokens(id: string) {
    return await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'emailVerificationToken',
        'emailVerificationTokenExpiresAt',
        'isEmailVerified',
        'password',
        'editPasswordToken',
        'editPasswordTokenExpiresAt',
        'phone',
        'phoneVerificationToken',
        'phoneVerificationTokenExpiresAt',
        'isPhoneVerified',
        'address',
        'dateOfBirth',
        'gender',
        'tokenVersion',
      ],
      relations: ['roles', 'roles.permissions'],
    });
  }

  async findOneByEmailOrPhoneForTokens(email: string, phone: string) {
    return await this.userRepository.findOne({
      where: [{ email }, { phone }],
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'isEmailVerified',
        'emailVerificationTokenExpiresAt',
        'emailVerificationToken',
        'address',
        'phone',
        'phoneVerificationTokenExpiresAt',
        'isPhoneVerified',
        'phoneVerificationToken',
        'password',
        'editPasswordToken',
        'editPasswordTokenExpiresAt',
        'tokenVersion',
      ],
    });
  }

  async findOneForTokens(id: string) {
    return await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'isEmailVerified',
        'emailVerificationTokenExpiresAt',
        'emailVerificationToken',
        'address',
        'phone',
        'phoneVerificationTokenExpiresAt',
        'isPhoneVerified',
        'phoneVerificationToken',
        'password',
        'editPasswordToken',
        'editPasswordTokenExpiresAt',
        'tokenVersion',
      ],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      updateUserDto.password = await this.encryptPassword(
        updateUserDto.password,
      );
    }

    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);
    return await this.findOne(id);
  }

  async remove(id: string) {
    return await this.userRepository.delete(id);
  }

  async findOneByEmail(email: string) {
    return await this.userRepository.findOne({
      where: { email },
      relations: ['roles'],
    });
  }

  async findOneByPhone(phone: string) {
    return await this.userRepository.findOne({
      where: { phone },
      relations: ['roles'],
    });
  }

  async findOneByEmailOrPhone(email: string, phone: string) {
    return await this.userRepository.findOne({
      where: [{ email }, { phone }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        password: true,
        address: true,
        dateOfBirth: true,
        gender: true,
        tokenVersion: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        profilePicture: true,
        accountStatus: true,
      },
      relations: ['roles'],
    });
  }

  async updateRoles(id: string, roles: any[]) {
    const user = await this.findOne(id);
    if (user) {
      user.roles = roles;
      return await this.userRepository.save(user);
    }
    return null;
  }

  async markEmailVerified(userId: string) {
    await this.userRepository.update(userId, {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpiresAt: null,
    });
  }

  async markPhoneVerified(userId: string) {
    await this.userRepository.update(userId, {
      isPhoneVerified: true,
      phoneVerificationToken: null,
      phoneVerificationTokenExpiresAt: null,
    });
  }
}
