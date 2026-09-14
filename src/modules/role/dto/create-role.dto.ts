import { IsNotEmpty, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IdDto } from 'src/shared/utils/Helper';

export class CreateRoleDto {
  @ApiProperty({ example: 'editor' })
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    type: [IdDto],
    description: 'Permission IDs to attach',
    example: [{ id: '018f...' }],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IdDto)
  permissions?: IdDto[];
}
