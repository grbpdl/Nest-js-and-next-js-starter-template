import {
  IsNotEmpty,
  IsEmail,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from 'src/modules/role/entities/role.entity';
import { IsStrongPassword } from 'src/shared/utils/Helper';

export class CreateUserDto {
  @ApiProperty({ example: 'Jane' })
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsNotEmpty()
  @IsEmail(
    { domain_specific_validation: true },
    { message: 'Invalid email provided. Please provide valid email.' },
  )
  email: string;

  @ApiProperty({
    example: 'Password@123',
    description:
      'Min 8 chars with upper, lower, number, and special character',
  })
  @IsNotEmpty()
  @IsStrongPassword()
  password: string;

  @ApiPropertyOptional({ example: '9800000000' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'object' },
    description: 'Optional roles (usually assigned by the server)',
  })
  @IsArray()
  @IsOptional()
  roles?: Role[];

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description:
      'Extra role IDs to assign when creating an admin (admin role is always included)',
    example: ['018f...'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  roleIds?: string[];

  @ApiPropertyOptional({ example: 'Kathmandu, Nepal' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.jpg' })
  @IsString()
  @IsOptional()
  profilePicture?: string;

  @ApiPropertyOptional({ example: '1997-07-22' })
  @IsOptional()
  dateOfBirth?: Date;
}
