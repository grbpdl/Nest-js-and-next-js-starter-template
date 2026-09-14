import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  PermissionActions,
  PermissionEntities,
} from '../entities/permission.entity';

export class CreatePermissionDto {
  @ApiProperty({ enum: PermissionActions, example: PermissionActions.READ })
  @IsEnum(PermissionActions)
  @IsNotEmpty()
  action: PermissionActions;

  @ApiProperty({ enum: PermissionEntities, example: PermissionEntities.USER })
  @IsEnum(PermissionEntities)
  @IsNotEmpty()
  entity: PermissionEntities;
}
