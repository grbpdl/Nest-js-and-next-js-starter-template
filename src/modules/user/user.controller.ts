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

import { User } from './entities/user.entity';
import { CheckOwnerOrPermissionsGuard } from 'src/modules/auth/guards/check-owner-or-permissions.guard';
import { CheckOwnerOrPermissions } from 'src/modules/auth/decorators/check-owner-or-permissions.decorator';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { RoleService } from '../role/role.service';
import { RoleGuard } from '../role/guards/role.guard';
import { AllowedRoles } from '../role/decorators/role.decorator';
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
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create user (public signup-style)',
    description: 'Assigns the default `user` role.',
  })
  @ApiCreatedResponse({ type: ApiSuccessResponseDto })
  @ApiConflictResponse({ type: ApiErrorResponseDto })
  async create(@Body() createUserDto: CreateUserDto) {
    const existingUserByEmail = await this.userService.findOneByEmail(
      createUserDto.email,
    );
    if (existingUserByEmail) {
      throw new ConflictException({
        statusCode: HttpStatus.CONFLICT,
        error: true,
        type: 'Conflict',
        message: `User already exists with email address ${createUserDto.email}`,
      });
    }

    if (createUserDto.phone) {
      const existingUserByPhone = await this.userService.findOneByPhone(
        createUserDto.phone,
      );
      if (existingUserByPhone) {
        throw new ConflictException({
          statusCode: HttpStatus.CONFLICT,
          error: true,
          type: 'Conflict',
          message: `User already exists with phone number ${createUserDto.phone}`,
        });
      }
    }

    const UserRole = await this.roleService.findByNameOrCreate('user');
    const newUser = await this.userService.create({
      ...createUserDto,
      roles: [UserRole],
    });
    const { password, ...data } = newUser;
    return {
      statusCode: 201,
      error: false,
      message: 'User created successfully',
      data,
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
