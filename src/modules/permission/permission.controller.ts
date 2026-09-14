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

import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { RequiredPermissions } from './decorators/permission.decorator';
import { PermissionGuard } from './guards/permission.guard';
import { ApiAuth } from 'src/shared/swagger/api-auth.decorator';
import {
  ApiErrorResponseDto,
  ApiSuccessResponseDto,
} from 'src/shared/swagger/api-response.dto';

@ApiTags('Permission')
@ApiAuth()
@Controller('permission')
@UseGuards(AuthGuard, PermissionGuard)
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  @RequiredPermissions('create:permission')
  @ApiOperation({
    summary: 'Create permission',
    description: 'Requires `create:permission`.',
  })
  @ApiCreatedResponse({ type: ApiSuccessResponseDto })
  @ApiConflictResponse({ type: ApiErrorResponseDto })
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    const permission = await this.permissionService.findOneWithActionEntity(
      createPermissionDto.action,
      createPermissionDto.entity,
    );
    if (permission) {
      throw new ConflictException({
        statusCode: HttpStatus.CONFLICT,
        error: true,
        type: 'Conflict',
        message: `Permission already exists with action ${createPermissionDto.action} and entity ${createPermissionDto.entity}`,
      });
    }
    const data = await this.permissionService.create(createPermissionDto);
    return {
      statusCode: 201,
      error: false,
      message: 'Permission created successfully',
      data,
    };
  }

  @Get()
  @RequiredPermissions('read:permission')
  @ApiOperation({
    summary: 'List permissions',
    description: 'Requires `read:permission`.',
  })
  @ApiOkResponse({ type: ApiSuccessResponseDto })
  async findAll() {
    const data = await this.permissionService.findAll();
    return {
      statusCode: 200,
      error: false,
      message: 'All permisson data',
      data,
    };
  }

  @Get(':id')
  @RequiredPermissions('read:permission')
  @ApiOperation({ summary: 'Get permission by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ApiSuccessResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const permission = await this.permissionService.findOne(id);
    if (!permission) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        error: true,
        message: `Permission not found with provided id ${id}`,
      };
    }
    return {
      statusCode: 200,
      error: false,
      message: 'Permission retrieved successfully',
      data: permission,
    };
  }

  @Patch(':id')
  @RequiredPermissions('update:permission')
  @ApiOperation({
    summary: 'Update permission',
    description: 'Requires `update:permission`.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ApiSuccessResponseDto })
  @ApiConflictResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    const permission = await this.permissionService.findOne(id);

    if (!permission) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        error: true,
        message: `Permission not found with provided id ${id}`,
      };
    }

    const findPermWithActionEntity =
      await this.permissionService.findOneWithActionEntity(
        updatePermissionDto.action,
        updatePermissionDto.entity,
      );

    if (
      findPermWithActionEntity &&
      findPermWithActionEntity.id !== permission.id
    ) {
      throw new ConflictException({
        statusCode: HttpStatus.CONFLICT,
        error: true,
        type: 'Conflict',
        message: `Permission already exists with action ${updatePermissionDto.action} and entity ${updatePermissionDto.entity}`,
      });
    }
    const data = await this.permissionService.update(id, updatePermissionDto);
    return {
      statusCode: 200,
      error: false,
      message: 'Permission updated successfully',
      data,
    };
  }

  @Delete(':id')
  @RequiredPermissions('delete:permission')
  @ApiOperation({
    summary: 'Delete permission',
    description: 'Requires `delete:permission`.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Delete result' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.permissionService.remove(id);
  }
}
