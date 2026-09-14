import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address or phone number',
  })
  @IsNotEmpty()
  emailOrPhone: string;

  @ApiProperty({ example: 'Password@123', format: 'password' })
  @IsNotEmpty()
  password: string;
}
