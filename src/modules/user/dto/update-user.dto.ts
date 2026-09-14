import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsDefinedAny } from 'src/shared/utils/Helper';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({
    description: 'Internal flag — at least one updatable field must be present',
    readOnly: true,
  })
  @IsDefinedAny([
    'firstName',
    'lastName',
    'email',
    'password',
    'phone',
    'roles',
    'address',
    'gender',
    'profilePicture',
  ])
  isDefinedAny?: boolean;
}
