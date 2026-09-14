import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  ConflictException,
  UseGuards,
  ParseUUIDPipe,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AdminSetPasswordDto } from './dto/admin-set-password.dto';

import { User } from './entities/user.entity';
import { CheckOwnerOrPermissionsGuard } from 'src/modules/auth/guards/check-owner-or-permissions.guard';
import { CheckOwnerOrPermissions } from 'src/modules/auth/decorators/check-owner-or-permissions.decorator';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { AuthService } from 'src/modules/auth/auth.service';
import { RoleService } from '../role/role.service';
import { RoleGuard } from '../role/guards/role.guard';
import { RequiredRoles, AllowedRoles } from '../role/decorators/role.decorator';
import { BASE_APP_ROLES } from '../role/entities/role.entity';
import { ApiAuth } from 'src/shared/swagger/api-auth.decorator';
import {
  ApiErrorResponseDto,
  ApiSuccessResponseDto,
} from 'src/shared/swagger/api-response.dto';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly roleService: RoleService,
    private readonly authService: AuthService,
  ) {}

  private async assertUniqueEmailPhone(email: string, phone?: string) {
    const existingUserByEmail = await this.userService.findOneByEmail(email);
    if (existingUserByEmail) {
      throw new ConflictException({
        statusCode: HttpStatus.CONFLICT,
        error: true,
        type: 'Conflict',
        message: `User already exists with email address ${email}`,
      });
    }

    if (phone) {
      const existingUserByPhone = await this.userService.findOneByPhone(phone);
      if (existingUserByPhone) {
        throw new ConflictException({
          statusCode: HttpStatus.CONFLICT,
          error: true,
          type: 'Conflict',
          message: `User already exists with phone number ${phone}`,
        });
      }
    }
  }

  @Post()
  @UseGuards(AuthGuard, RoleGuard)
  @RequiredRoles(BASE_APP_ROLES.SUPER_ADMIN)
  @ApiAuth()
  @ApiOperation({
    summary: 'Create user (super_admin)',
    description:
      'Creates a verified user with the `user` role. Self-signup must use `POST /auth/register` + OTP.',
  })
  @ApiCreatedResponse({ type: ApiSuccessResponseDto })
  @ApiConflictResponse({ type: ApiErrorResponseDto })
  async create(@Body() createUserDto: CreateUserDto) {
    await this.assertUniqueEmailPhone(createUserDto.email, createUserDto.phone);

    const userRole = await this.roleService.findByNameOrCreate(
      BASE_APP_ROLES.USER,
    );
    const newUser = await this.userService.create({
      ...createUserDto,
      roles: [userRole],
    });
    await this.userService.markEmailVerified(newUser.id);
    if (newUser.phone) {
      await this.userService.markPhoneVerified(newUser.id);
    }

    const data = await this.userService.findOne(newUser.id);
    const { password: _pwd, ...safe } = data as User & { password?: string };
    return {
      statusCode: HttpStatus.CREATED,
      error: false,
      message: 'User created successfully',
      data: safe,
    };
  }

  @Post('admin')
  @UseGuards(AuthGuard, RoleGuard)
  @RequiredRoles(BASE_APP_ROLES.SUPER_ADMIN)
  @ApiAuth()
  @ApiOperation({
    summary: 'Create admin (super_admin)',
    description: 'Creates a verified user with the `admin` role.',
  })
  @ApiCreatedResponse({ type: ApiSuccessResponseDto })
  @ApiConflictResponse({ type: ApiErrorResponseDto })
  async createAdmin(@Body() createUserDto: CreateUserDto) {
    await this.assertUniqueEmailPhone(createUserDto.email, createUserDto.phone);

    const adminRole = await this.roleService.findByNameOrCreate(
      BASE_APP_ROLES.ADMIN,
    );
    const newUser = await this.userService.create({
      ...createUserDto,
      roles: [adminRole],
    });
    await this.userService.markEmailVerified(newUser.id);
    if (newUser.phone) {
      await this.userService.markPhoneVerified(newUser.id);
    }

    const data = await this.userService.findOne(newUser.id);
    const { password: _pwd, ...safe } = data as User & { password?: string };
    return {
      statusCode: HttpStatus.CREATED,
      error: false,
      message: 'Admin created successfully',
      data: safe,
    };
  }

  @Get()
  @UseGuards(AuthGuard, RoleGuard)
  @AllowedRoles(BASE_APP_ROLES.ADMIN)
  @ApiAuth()
  @ApiOperation({
    summary: 'List all users',
    description: 'Requires admin (or super_admin) role.',
  })
  @ApiOkResponse({ type: ApiSuccessResponseDto })
  async findAll() {
    const data = await this.userService.findAll();
    return {
      statusCode: HttpStatus.OK,
      error: false,
      message: 'All user data',
      data,
    };
  }

  @Get('users')
  @UseGuards(AuthGuard, RoleGuard)
  @RequiredRoles(BASE_APP_ROLES.SUPER_ADMIN)
  @ApiAuth()
  @ApiOperation({
    summary: 'List accounts with role `user`',
    description: 'Super admin only.',
  })
  @ApiOkResponse({ type: ApiSuccessResponseDto })
  async listRegularUsers() {
    const data = await this.userService.findByRoleName(BASE_APP_ROLES.USER);
    return {
      statusCode: HttpStatus.OK,
      error: false,
      message: 'Users retrieved successfully',
      data,
    };
  }

  @Get('admins')
  @UseGuards(AuthGuard, RoleGuard)
  @RequiredRoles(BASE_APP_ROLES.SUPER_ADMIN)
  @ApiAuth()
  @ApiOperation({
    summary: 'List accounts with role `admin`',
    description: 'Super admin only. Does not include super_admin accounts.',
  })
  @ApiOkResponse({ type: ApiSuccessResponseDto })
  async listAdmins() {
    const data = await this.userService.findByRoleName(BASE_APP_ROLES.ADMIN);
    return {
      statusCode: HttpStatus.OK,
      error: false,
      message: 'Admins retrieved successfully',
      data,
    };
  }

  @Post(':id/password')
  @UseGuards(AuthGuard, RoleGuard)
  @RequiredRoles(BASE_APP_ROLES.SUPER_ADMIN)
  @ApiAuth()
  @ApiOperation({
    summary: 'Set password for another user (super_admin)',
    description:
      'Sets a new password for any user/admin. Revokes their sessions and clears FCM tokens.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ApiSuccessResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  async setPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AdminSetPasswordDto,
  ) {
    const existing = await this.userService.findOne(id);
    if (!existing) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        error: true,
        type: 'Not Found',
        message: `User not found with provided id ${id}`,
      });
    }
    await this.authService.setPasswordForUser(id, body.newPassword);
    return {
      statusCode: HttpStatus.OK,
      error: false,
      message: 'Password updated successfully',
    };
  }

  @Get(':id')
  @UseGuards(AuthGuard, CheckOwnerOrPermissionsGuard)
  @CheckOwnerOrPermissions(User, 'id', ['read:user'])
  @ApiAuth()
  @ApiOperation({
    summary: 'Get user by id',
    description: 'Owner or user with `read:user` permission.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ApiSuccessResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.userService.findOne(id);
    if (!data) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        error: true,
        type: 'Not Found',
        message: `User not found with provided id ${id}`,
      });
    }
    return {
      statusCode: HttpStatus.OK,
      error: false,
      data,
      message: 'User retrieved successfully',
    };
  }

  @Patch(':id')
  @UseGuards(AuthGuard, CheckOwnerOrPermissionsGuard)
  @CheckOwnerOrPermissions(User, 'id', ['update:user'])
  @ApiAuth()
  @ApiOperation({
    summary: 'Update user',
    description: 'Owner or user with `update:user` permission.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ApiSuccessResponseDto })
  @ApiConflictResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const existingUser = await this.userService.findOne(id);
    if (!existingUser) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        error: true,
        type: 'Not Found',
        message: `User not found with provided id ${id}`,
      });
    }
    if (updateUserDto.email) {
      const findUserByEmail = await this.userService.findOneByEmail(
        updateUserDto.email,
      );
      if (findUserByEmail && findUserByEmail.id !== existingUser.id) {
        throw new ConflictException({
          statusCode: HttpStatus.CONFLICT,
          error: true,
          type: 'Conflict',
          message: `User already exists with email ${updateUserDto.email}`,
        });
      }
    }

    if (updateUserDto.phone) {
      const findUserByPhone = await this.userService.findOneByPhone(
        updateUserDto.phone,
      );
      if (findUserByPhone && findUserByPhone.id !== existingUser.id) {
        throw new ConflictException({
          statusCode: HttpStatus.CONFLICT,
          error: true,
          type: 'Conflict',
          message: `User already exists with phone ${updateUserDto.phone}`,
        });
      }
    }
    const data = await this.userService.update(id, updateUserDto);
    return {
      statusCode: 200,
      error: false,
      message: 'User updated successfully',
      data,
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard, CheckOwnerOrPermissionsGuard)
  @CheckOwnerOrPermissions(User, 'id', ['delete:user'])
  @ApiAuth()
  @ApiOperation({
    summary: 'Delete user',
    description: 'Owner or user with `delete:user` permission.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ApiSuccessResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.userService.findOne(id);
    if (!user) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        error: true,
        type: 'Not Found',
        message: `User not found with provided id ${id}`,
      });
    }
    await this.userService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      error: false,
      message: 'User deleted successfully',
    };
  }
}
