import { PartialType } from '@nestjs/swagger';
import { CreatePermissionDto } from './create-permission.dto';
import { IsDefinedAny } from 'src/shared/utils/Helper';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {
  @ApiPropertyOptional({ readOnly: true })
  @IsDefinedAny(['action', 'entity'])
  isDefinedAny?: boolean;
}
