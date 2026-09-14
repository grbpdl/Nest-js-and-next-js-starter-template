import { IsEmail, IsEnum, IsString, Length, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OtpPurpose } from '../enums';

export class SendOtpDto {
  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'Required when phone is omitted',
  })
  @ValidateIf((o: SendOtpDto) => !o.phone)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: '9800000000',
    description: 'Required when email is omitted',
  })
  @ValidateIf((o: SendOtpDto) => !o.email)
  @IsString()
  phone?: string;

  @ApiProperty({
    enum: OtpPurpose,
    example: OtpPurpose.VERIFY_EMAIL,
    description: 'Why the OTP is being sent',
  })
  @IsEnum(OtpPurpose)
  purpose: OtpPurpose;
}

export class VerifyOtpDto {
  @ApiPropertyOptional({ example: 'user@example.com' })
  @ValidateIf((o: VerifyOtpDto) => !o.phone)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '9800000000' })
  @ValidateIf((o: VerifyOtpDto) => !o.email)
  @IsString()
  phone?: string;

  @ApiProperty({ enum: OtpPurpose, example: OtpPurpose.VERIFY_EMAIL })
  @IsEnum(OtpPurpose)
  purpose: OtpPurpose;

  @ApiProperty({ example: '123456', minLength: 6, maxLength: 6 })
  @IsString()
  @Length(6, 6)
  code: string;
}

export class ResendOtpDto {
  @ApiPropertyOptional({ example: 'user@example.com' })
  @ValidateIf((o: ResendOtpDto) => !o.phone)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '9800000000' })
  @ValidateIf((o: ResendOtpDto) => !o.email)
  @IsString()
  phone?: string;

  @ApiProperty({ enum: OtpPurpose, example: OtpPurpose.VERIFY_EMAIL })
  @IsEnum(OtpPurpose)
  purpose: OtpPurpose;
}

export class SendOtpMeDto {
  @ApiProperty({
    enum: OtpPurpose,
    example: OtpPurpose.VERIFY_EMAIL,
    description:
      'Uses the authenticated user email (or phone for verify_phone)',
  })
  @IsEnum(OtpPurpose)
  purpose: OtpPurpose;
}
