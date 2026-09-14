import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRoleDto {
  @ApiProperty({ format: 'uuid', example: '018f...' })
  @IsUUID()
  userId: string;

  @ApiProperty({
    type: [String],
    format: 'uuid',
    example: ['018f...'],
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  roleIds: string[];
}

export class RevokeRoleDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId: string;

  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @IsUUID(undefined, { each: true })
  roleIds: string[];
}

export class RolePermissionsDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @IsUUID(undefined, { each: true })
  permissionIds: string[];
}
