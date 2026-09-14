import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from 'src/shared/utils/Helper';

export class AdminSetPasswordDto {
  @ApiProperty({
    example: 'NewPassword@123',
    description:
      'Min 8 chars with upper, lower, number, and special character',
  })
  @IsNotEmpty()
  @IsStrongPassword()
  newPassword: string;
}
