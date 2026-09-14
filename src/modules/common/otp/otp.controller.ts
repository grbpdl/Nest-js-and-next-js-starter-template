import {
  Body,
  Controller,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { OtpService } from './otp.service';
import {
  ResendOtpDto,
  SendOtpDto,
  SendOtpMeDto,
  VerifyOtpDto,
} from './dto/otp.dto';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { OtpPurpose } from './enums';
import { ApiAuth } from 'src/shared/swagger/api-auth.decorator';
import {
  ApiErrorResponseDto,
  ApiSuccessResponseDto,
} from 'src/shared/swagger/api-response.dto';

@ApiTags('OTP')
@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('send')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Send OTP',
    description:
      'Provide email or phone. Email uses SMTP; phone uses Discord when SMS_DEBUG=true, else Twilio.',
  })
  @ApiCreatedResponse({ type: ApiSuccessResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  async send(@Body() dto: SendOtpDto) {
    const result = await this.otpService.send(dto);
    return {
      statusCode: HttpStatus.CREATED,
      error: false,
      message: result.message,
    };
  }

  @Post('send/me')
  @UseGuards(AuthGuard)
  @ApiAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Send OTP to the authenticated user',
    description:
      'verify_phone uses user.phone; other purposes use user.email.',
  })
  @ApiCreatedResponse({ type: ApiSuccessResponseDto })
  async sendForMe(
    @Request() req: { user: any },
    @Body() body: SendOtpMeDto,
  ) {
    const purpose = body.purpose;
    const dto: SendOtpDto =
      purpose === OtpPurpose.VERIFY_PHONE
        ? { phone: req.user.phone, purpose }
        : { email: req.user.email, purpose };

    const result = await this.otpService.send(dto, req.user.id);
    return {
      statusCode: HttpStatus.CREATED,
      error: false,
      message: result.message,
    };
  }

  @Post('verify')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Verify OTP',
    description:
      'Marks email/phone verified on the linked user when purpose is verify_* or register.',
  })
  @ApiOkResponse({ type: ApiSuccessResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  async verify(@Body() dto: VerifyOtpDto) {
    const result = await this.otpService.verify(dto);
    return {
      statusCode: HttpStatus.OK,
      error: false,
      message: 'OTP verified successfully',
      data: result,
    };
  }

  @Post('resend')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Resend OTP (invalidates previous unused codes)' })
  @ApiCreatedResponse({ type: ApiSuccessResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  async resend(@Body() dto: ResendOtpDto) {
    const result = await this.otpService.resend(dto);
    return {
      statusCode: HttpStatus.CREATED,
      error: false,
      message: result.message,
    };
  }
}
