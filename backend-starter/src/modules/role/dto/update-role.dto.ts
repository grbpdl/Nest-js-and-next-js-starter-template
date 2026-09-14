import { PartialType } from '@nestjs/swagger';
import { CreateRoleDto } from './create-role.dto';
import { IsDefinedAny } from 'src/shared/utils/Helper';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
  @ApiPropertyOptional({ readOnly: true })
  @IsDefinedAny(['name', 'permissions'])
  isDefinedAny?: boolean;
}
