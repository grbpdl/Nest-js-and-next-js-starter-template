import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpStatus,
  Post,
  UseGuards,
  Request,
  Get,
  Res,
  HttpCode,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Throttle } from '@nestjs/throttler';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthGuard } from './guards/auth.guard';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { Request as ExpressRequest, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiAuth } from 'src/shared/swagger/api-auth.decorator';
import {
  ApiErrorResponseDto,
  ApiSuccessResponseDto,
} from 'src/shared/swagger/api-response.dto';
import { extractRefreshToken } from './utils/extract-access-token';
import { parseDurationToMs } from './utils/parse-duration';
import { LogoutDto } from 'src/modules/device/dto/device-context.dto';
import { getClientIp, getUserAgent } from 'src/modules/device/utils/request-meta';
import EnvironmentConfiguration from 'src/config/env.config';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private getCookieBase() {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ('none' as const) : ('lax' as const),
      path: '/',
    };
  }

  private getAccessCookieOptions() {
    return {
      ...this.getCookieBase(),
      maxAge: parseDurationToMs(
        this.configService.get('JWT_ACCESS_EXPIRATION') ||
          EnvironmentConfiguration.JWT_ACCESS_EXPIRATION,
        15 * 60 * 1000,
      ),
    };
  }

  private getRefreshCookieOptions() {
    return {
      ...this.getCookieBase(),
      maxAge: parseDurationToMs(
        this.configService.get('JWT_REFRESH_EXPIRATION') ||
          EnvironmentConfiguration.JWT_REFRESH_EXPIRATION,
        7 * 24 * 60 * 60 * 1000,
      ),
    };
  }

  private setAuthCookies(
    res: Response,
    tokens: { access_token: string; refresh_token: string },
  ) {
    res.cookie('access_token', tokens.access_token, this.getAccessCookieOptions());
    res.cookie(
      'refresh_token',
      tokens.refresh_token,
      this.getRefreshCookieOptions(),
    );
  }

  private clearAuthCookies(res: Response) {
    const base = this.getCookieBase();
    res.clearCookie('access_token', { ...base, expires: new Date(0) });
    res.clearCookie('refresh_token', { ...base, expires: new Date(0) });
  }

  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates an unverified user and sends email (and phone) OTP for verification.',
  })
  @ApiCreatedResponse({ type: ApiSuccessResponseDto })
  @ApiConflictResponse({ type: ApiErrorResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);
    return {
      statusCode: HttpStatus.CREATED,
      error: false,
      message: 'Registered successfully. Please verify email/phone OTP.',
      data: user,
    };
  }

  @Post('/forgot-password')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Request password-reset OTP',
    description:
      'Send `emailOrPhone`. OTP is emailed for email addresses, or sent by SMS/Discord for phone numbers. Always returns success when the request is valid.',
  })
  @ApiCreatedResponse({ type: ApiSuccessResponseDto })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.requestPasswordReset(
      forgotPasswordDto.emailOrPhone,
    );
    return {
      statusCode: HttpStatus.CREATED,
      error: false,
      message: 'If the account exists, an OTP has been sent.',
    };
  }

  @Post('/reset-password')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Reset password with OTP',
    description:
      '`token` is the 6-digit OTP from forgot-password. Revokes existing sessions.',
  })
  @ApiCreatedResponse({ type: ApiSuccessResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const ok = await this.authService.resetPasswordWithOtp(
      resetPasswordDto.emailOrPhone,
      resetPasswordDto.token,
      resetPasswordDto.password,
    );
    if (ok) {
      return {
        statusCode: HttpStatus.CREATED,
        error: false,
        message: 'Password reset successfully',
      };
    }
    throw new BadRequestException({
      statusCode: HttpStatus.BAD_REQUEST,
      error: true,
      type: 'BadRequest',
      message: 'Invalid or expired token',
    });
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiAuth()
  @ApiOperation({
    summary: 'Change own password',
    description:
      'Requires current password. Revokes all sessions and clears FCM tokens.',
  })
  @ApiOkResponse({ type: ApiSuccessResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  async changePassword(
    @Request() req: { user: { id: string } },
    @Body() body: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.changePassword(
      req.user.id,
      body.currentPassword,
      body.newPassword,
    );
    this.clearAuthCookies(res);
    return {
      statusCode: HttpStatus.OK,
      error: false,
      message: 'Password changed successfully. Please log in again.',
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login with email/phone and password',
    description:
      'Sets httpOnly cookies and returns tokens. Optional `deviceId` / `fcmToken` / `deviceInfo` register the device (IP + platform) for multi-device and push.',
  })
  @ApiOkResponse({ type: ApiSuccessResponseDto })
  @ApiConflictResponse({
    description: 'Invalid credentials',
    type: ApiErrorResponseDto,
  })
  async login(
    @Body() loginDto: LoginDto,
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const loginResult = await this.authService.login(
      loginDto.emailOrPhone,
      loginDto.password,
      {
        deviceId: loginDto.deviceId,
        fcmToken: loginDto.fcmToken,
        deviceInfo: loginDto.deviceInfo,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      },
    );

    if (!loginResult) {
      throw new ConflictException({
        statusCode: HttpStatus.CONFLICT,
        error: true,
        type: 'Conflict',
        message: 'user credentials are not valid',
      });
    }

    const { access_token, refresh_token, user } = loginResult;
    this.setAuthCookies(res, { access_token, refresh_token });

    return {
      statusCode: HttpStatus.OK,
      error: false,
      data: { ...user, access_token, refresh_token },
      message: 'User login successfully',
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({
    summary: 'Refresh access (and refresh) tokens',
    description:
      'Browser: send `refresh_token` cookie. Mobile: send `refresh_token` in JSON body or `X-Refresh-Token` header. Optional device fields update last IP / FCM.',
  })
  @ApiOkResponse({ type: ApiSuccessResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  async refresh(
    @Body() body: RefreshTokenDto,
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = extractRefreshToken(req, body.refresh_token);
    if (!refreshToken) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        error: true,
        message: 'Refresh token required',
      });
    }

    const tokens = await this.authService.refreshTokens(refreshToken, {
      deviceId: body.deviceId,
      fcmToken: body.fcmToken,
      deviceInfo: body.deviceInfo,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });
    this.setAuthCookies(res, tokens);

    return {
      statusCode: HttpStatus.OK,
      error: false,
      data: tokens,
      message: 'Tokens refreshed successfully',
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiAuth()
  @ApiOperation({
    summary: 'Logout',
    description:
      'Clears cookies, revokes JWT sessions (`tokenVersion`), and clears FCM token(s) so push stops after logout. Pass `deviceId` to clear only that device; omit to clear all devices.',
  })
  @ApiOkResponse({ type: ApiSuccessResponseDto })
  async logout(
    @Request() req: { user: { id: string } },
    @Body() body: LogoutDto = {},
    @Res({ passthrough: true }) res: Response,
  ) {
    if (req.user?.id) {
      await this.authService.logout(req.user.id, body?.deviceId);
    }
    this.clearAuthCookies(res);

    return {
      statusCode: HttpStatus.OK,
      error: false,
      message: 'Logged out successfully',
    };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiAuth()
  @ApiOperation({
    summary: 'Current authenticated user',
    description:
      'Includes roles and a flat `permissions` array (`entity:action`) derived from role permissions.',
  })
  @ApiOkResponse({ type: ApiSuccessResponseDto })
  async me(@Request() request: any) {
    if (request.user) {
      const roles = request.user.roles ?? [];
      const permissionSet = new Set<string>();
      for (const role of roles) {
        for (const permission of role.permissions ?? []) {
          permissionSet.add(`${permission.entity}:${permission.action}`);
        }
      }
      return {
        statusCode: HttpStatus.OK,
        error: false,
        data: {
          ...request.user,
          permissions: Array.from(permissionSet).sort(),
        },
        message: 'User details',
      };
    }
    throw new BadRequestException({
      statusCode: HttpStatus.BAD_REQUEST,
      error: true,
      type: 'BadRequest',
      message: 'User not found',
    });
  }

  @Get('google')
  @UseGuards(PassportAuthGuard('google'))
  @ApiOperation({
    summary: 'Start Google OAuth',
    description: 'Browser redirect to Google consent screen.',
  })
  async googleAuth() {
    // Initiates the Google OAuth2 flow
  }

  @Get('google/callback')
  @UseGuards(PassportAuthGuard('google'))
  @ApiOperation({
    summary: 'Google OAuth callback',
    description:
      'Sets access + refresh cookies and redirects to `${ORIGIN}/auth/callback?access_token=...&refresh_token=...`.',
  })
  async googleAuthRedirect(
    @Request() req: { user: any },
    @Res() res: Response,
  ) {
    const frontendUrl = this.configService.get('ORIGIN');
    if (!req.user) {
      return res.redirect(`${frontendUrl}/auth/callback`);
    }

    const result = await this.authService.validateGoogleUser(req.user);
    this.setAuthCookies(res, {
      access_token: result.access_token,
      refresh_token: result.refresh_token,
    });

    const redirectUrl = new URL(`${frontendUrl}/auth/callback`);
    redirectUrl.searchParams.set('access_token', result.access_token);
    redirectUrl.searchParams.set('refresh_token', result.refresh_token);
    return res.redirect(redirectUrl.toString());
  }
}
