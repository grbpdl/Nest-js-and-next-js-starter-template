import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsStrongPassword } from 'src/shared/utils/Helper';

export class RegisterDto {
  @ApiProperty({ example: 'Jane' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '9800000000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    example: 'Password@123',
    description:
      'Min 8 chars with upper, lower, number, and special character',
  })
  @IsNotEmpty()
  @IsStrongPassword()
  password: string;
}
