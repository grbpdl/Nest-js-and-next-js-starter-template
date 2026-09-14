import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from 'src/shared/utils/Helper';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address or phone number used to request the OTP',
  })
  @IsNotEmpty()
  emailOrPhone: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit OTP received via email or SMS/Discord',
  })
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: 'NewPassword@123',
    description:
      'Min 8 chars with upper, lower, number, and special character',
  })
  @IsNotEmpty()
  @IsStrongPassword()
  password: string;
}
