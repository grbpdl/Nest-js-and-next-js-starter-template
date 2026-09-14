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
  NotFoundException,
  UseGuards,
  ParseUUIDPipe,
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

import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleService } from './role.service';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';

import {
  AssignRoleDto,
  RevokeRoleDto,
  RolePermissionsDto,
} from './dto/assign-role.dto';
import { PermissionGuard } from '../permission/guards/permission.guard';
import { RoleGuard } from './guards/role.guard';
import { RequiredPermissions } from '../permission/decorators/permission.decorator';
import { ApiAuth } from 'src/shared/swagger/api-auth.decorator';
import {
  ApiErrorResponseDto,
  ApiSuccessResponseDto,
} from 'src/shared/swagger/api-response.dto';

@ApiTags('Role')
@ApiAuth()
@UseGuards(AuthGuard, PermissionGuard, RoleGuard)
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @RequiredPermissions('create:role')
  @ApiOperation({ summary: 'Create role', description: 'Requires `create:role`.' })
  @ApiCreatedResponse({ type: ApiSuccessResponseDto })
  @ApiConflictResponse({ type: ApiErrorResponseDto })
  async create(@Body() createRoleDto: CreateRoleDto) {
    const role = await this.roleService.findOneByName(createRoleDto.name);
    if (role) {
      throw new ConflictException({
        statusCode: HttpStatus.CONFLICT,
        error: true,
        type: 'Conflict',
        message: `Role already exists with name ${createRoleDto.name}`,
      });
    }
    const newRole = await this.roleService.create(createRoleDto);
    return {
      statusCode: HttpStatus.CREATED,
      error: false,
      data: newRole,
      message: 'Role created successfully',
    };
  }

  @Get()
  @RequiredPermissions('read:role')
  @ApiOperation({ summary: 'List roles', description: 'Requires `read:role`.' })
  @ApiOkResponse({ type: ApiSuccessResponseDto })
  async findAll() {
    const data = await this.roleService.findAll();
    return {
      statusCode: HttpStatus.OK,
      error: false,
      message: 'all role data',
      data,
    };
  }

  @Get('/permissions/:id')
  @RequiredPermissions('read:role')
  @ApiOperation({ summary: 'Get role with permissions' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ApiSuccessResponseDto })
  async findOneWithRelations(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.roleService.findOneWithPermissions(id);
    return {
      statusCode: HttpStatus.OK,
      error: false,
      message: `All Role's permissions data of id ${id}`,
      data,
    };
  }

  @Get(':id')
  @RequiredPermissions('read:role')
  @ApiOperation({ summary: 'Get role by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ApiSuccessResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const role = await this.roleService.findOne(id);
    if (!role) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        error: true,
        type: 'Not Found',
        message: `Role not found with provided id ${id}`,
      });
    }
    return {
      statusCode: HttpStatus.OK,
      error: false,
      message: 'Role retrieved successfully',
      data: role,
    };
  }

  @Patch(':id')
  @RequiredPermissions('update:role')
  @ApiOperation({ summary: 'Update role', description: 'Requires `update:role`.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ApiSuccessResponseDto })
  @ApiConflictResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    const role = await this.roleService.findOneWithPermissions(id);
    if (!role) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        error: true,
        type: 'Not Found',
        message: `Role not found with provided id ${id}`,
      });
    }

    if (updateRoleDto.name) {
      const findByName = await this.roleService.findOneByName(
        updateRoleDto.name,
      );
      if (findByName && findByName.id !== role.id) {
        throw new ConflictException({
          statusCode: HttpStatus.CONFLICT,
          error: true,
          type: 'Conflict',
          message: `Role already exists with name ${updateRoleDto.name}`,
        });
      }
    }
    const data = await this.roleService.update(role, updateRoleDto);
    return {
      statusCode: HttpStatus.OK,
      error: false,
      message: 'Role updated successfully',
      data,
    };
  }

  @Delete(':id')
  @RequiredPermissions('delete:role')
  @ApiOperation({ summary: 'Delete role', description: 'Requires `delete:role`.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ApiSuccessResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const role = await this.roleService.findOne(id);
    if (!role) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        error: true,
        type: 'Not Found',
        message: `Role not found with provided id ${id}`,
      });
    }
    await this.roleService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      error: false,
      message: `Role deleted successfully`,
    };
  }

  @Post('assign')
  @RequiredPermissions('update:role')
  @ApiOperation({ summary: 'Assign roles to a user' })
  @ApiOkResponse({ description: 'Assignment result' })
  async assignRolesToUser(@Body() assignRoleDto: AssignRoleDto) {
    return await this.roleService.assignRolesToUser(assignRoleDto);
  }

  @Post('revoke')
  @RequiredPermissions('update:role')
  @ApiOperation({ summary: 'Revoke roles from a user' })
  @ApiOkResponse({ description: 'Revoke result' })
  async revokeRolesFromUser(@Body() body: RevokeRoleDto) {
    return await this.roleService.revokeRolesFromUser(
      body.userId,
      body.roleIds,
    );
  }

  @Post(':roleId/permissions')
  @RequiredPermissions('update:role')
  @ApiOperation({ summary: 'Attach permissions to a role' })
  @ApiParam({ name: 'roleId', format: 'uuid' })
  @ApiOkResponse({ description: 'Updated role permissions' })
  async addPermissionsToRole(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() body: RolePermissionsDto,
  ) {
    return await this.roleService.addPermissionsToRole(
      roleId,
      body.permissionIds,
    );
  }

  @Delete(':roleId/permissions')
  @RequiredPermissions('update:role')
  @ApiOperation({ summary: 'Detach permissions from a role' })
  @ApiParam({ name: 'roleId', format: 'uuid' })
  @ApiOkResponse({ description: 'Updated role permissions' })
  async removePermissionsFromRole(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() body: RolePermissionsDto,
  ) {
    return await this.roleService.removePermissionsFromRole(
      roleId,
      body.permissionIds,
    );
  }
}
