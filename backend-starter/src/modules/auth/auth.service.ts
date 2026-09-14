import {
  ConflictException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
  BadRequestException,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/modules/user/user.service';
import * as bcrypt from 'bcrypt';
import { User } from 'src/modules/user/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { RoleService } from 'src/modules/role/role.service';
import { OtpService } from 'src/modules/common/otp/otp.service';
import { OtpPurpose } from 'src/modules/common/otp/enums';
import { RegisterDto } from './dto/register.dto';
import EnvironmentConfiguration from 'src/config/env.config';
import { DeviceService } from 'src/modules/device/device.service';
import { DeviceInfoDto } from 'src/modules/device/entities/user-device.entity';

export type AuthTokenPair = {
  access_token: string;
  refresh_token: string;
};

export type DeviceLoginContext = {
  deviceId?: string;
  fcmToken?: string;
  deviceInfo?: DeviceInfoDto;
  ipAddress?: string;
  userAgent?: string;
};

type UserWithoutPassword = Omit<User, 'password' | 'generateId'>;

type TokenType = 'access' | 'refresh';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => RoleService))
    private readonly roleService: RoleService,
    @Inject(forwardRef(() => OtpService))
    private readonly otpService: OtpService,
    @Inject(forwardRef(() => DeviceService))
    private readonly deviceService: DeviceService,
  ) {}

  private get accessSecret() {
    return (
      this.configService.get<string>('JWT_SECRET') ||
      EnvironmentConfiguration.JWT_SECRET
    );
  }

  private get refreshSecret() {
    return (
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      EnvironmentConfiguration.JWT_REFRESH_SECRET ||
      this.accessSecret
    );
  }

  private get accessExpiresIn() {
    return (
      this.configService.get<string>('JWT_ACCESS_EXPIRATION') ||
      this.configService.get<string>('JWT_EXPIRATION') ||
      EnvironmentConfiguration.JWT_ACCESS_EXPIRATION
    );
  }

  private get refreshExpiresIn() {
    return (
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') ||
      EnvironmentConfiguration.JWT_REFRESH_EXPIRATION
    );
  }

  async issueTokenPair(user: {
    id: string;
    tokenVersion: number;
  }): Promise<AuthTokenPair> {
    const base = { sub: user.id, tokenVersion: user.tokenVersion ?? 0 };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(
        { ...base, type: 'access' satisfies TokenType },
        { secret: this.accessSecret, expiresIn: this.accessExpiresIn },
      ),
      this.jwtService.signAsync(
        { ...base, type: 'refresh' satisfies TokenType },
        { secret: this.refreshSecret, expiresIn: this.refreshExpiresIn },
      ),
    ]);

    return { access_token, refresh_token };
  }

  async register(dto: RegisterDto) {
    const existing = await this.userService.findOneByEmail(dto.email);
    if (existing) {
      throw new ConflictException({
        statusCode: HttpStatus.CONFLICT,
        error: true,
        message: 'Email already registered',
      });
    }

    if (dto.phone) {
      const byPhone = await this.userService.findOneByPhone(dto.phone);
      if (byPhone) {
        throw new ConflictException({
          statusCode: HttpStatus.CONFLICT,
          error: true,
          message: 'Phone already registered',
        });
      }
    }

    const userRole = await this.roleService.findByNameOrCreate('user');
    const user = await this.userService.create({
      ...dto,
      roles: [userRole],
    });

    await this.otpService.send(
      { email: user.email, purpose: OtpPurpose.VERIFY_EMAIL },
      user.id,
    );

    if (user.phone) {
      await this.otpService.send(
        { phone: user.phone, purpose: OtpPurpose.VERIFY_PHONE },
        user.id,
      );
    }

    const { password: _pwd, ...safe } = user as User;
    return safe;
  }

  async validateUser(emailOrPhone: string, password: string): Promise<User> {
    const user = await this.userService.findOneByEmailOrPhone(
      emailOrPhone,
      emailOrPhone,
    );
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async login(
    emailOrPhone: string,
    password: string,
    deviceContext?: DeviceLoginContext,
  ): Promise<
    (AuthTokenPair & { user: UserWithoutPassword }) | null
  > {
    const user = await this.validateUser(emailOrPhone, password);
    if (!user) return null;

    if (!user.isEmailVerified) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        error: true,
        message: 'Please verify your email OTP before logging in',
      });
    }

    await this.syncDevice(user.id, deviceContext);

    const tokens = await this.issueTokenPair(user);
    const { password: _pwd, ...userWithoutPassword } = user;
    return {
      ...tokens,
      user: userWithoutPassword as UserWithoutPassword,
    };
  }

  async refreshTokens(
    refreshToken: string,
    deviceContext?: DeviceLoginContext,
  ): Promise<AuthTokenPair> {
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.refreshSecret,
        ignoreExpiration: false,
      });
    } catch {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        error: true,
        message: 'Invalid or expired refresh token',
      });
    }

    if (payload?.type !== 'refresh') {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        error: true,
        message: 'Invalid refresh token',
      });
    }

    const user = await this.userService.findOneForMe(payload.sub);
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        error: true,
        message: 'Refresh token has been revoked',
      });
    }

    if (user.accountStatus && user.accountStatus !== 'active') {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        error: true,
        message: 'Account is not active',
      });
    }

    await this.syncDevice(user.id, deviceContext);

    return this.issueTokenPair(user);
  }

  /** Invalidate all existing access/refresh tokens for the user. */
  async revokeAllTokens(userId: string): Promise<void> {
    const user = await this.userService.findOneForTokens(userId);
    if (!user) return;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await this.userService.saveUser(user);
  }

  /**
   * Logout: revoke JWTs and clear FCM so the device stops receiving pushes.
   * With `deviceId`, clears that device only; otherwise clears FCM on all devices.
   */
  async logout(userId: string, deviceId?: string): Promise<void> {
    await this.revokeAllTokens(userId);
    if (deviceId) {
      await this.deviceService.clearFcmForDevice(userId, deviceId);
    } else {
      await this.deviceService.clearAllFcmForUser(userId);
    }
  }

  private async syncDevice(
    userId: string,
    deviceContext?: DeviceLoginContext,
  ): Promise<void> {
    if (!deviceContext?.deviceId) return;
    await this.deviceService.upsertDevice({
      userId,
      deviceId: deviceContext.deviceId,
      fcmToken: deviceContext.fcmToken,
      deviceInfo: deviceContext.deviceInfo,
      ipAddress: deviceContext.ipAddress,
      userAgent: deviceContext.userAgent,
    });
  }

  async isTokenValid(token: string): Promise<any> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.accessSecret,
        ignoreExpiration: false,
      });
    } catch {
      return null;
    }
  }

  async requestPasswordReset(emailOrPhone: string) {
    const user = await this.userService.findOneByEmailOrPhone(
      emailOrPhone,
      emailOrPhone,
    );
    if (!user) {
      return true;
    }

    const isEmail = emailOrPhone.includes('@');
    if (isEmail) {
      await this.otpService.send(
        { email: user.email, purpose: OtpPurpose.RESET_PASSWORD },
        user.id,
      );
    } else if (user.phone) {
      await this.otpService.send(
        { phone: user.phone, purpose: OtpPurpose.RESET_PASSWORD },
        user.id,
      );
    } else {
      throw new BadRequestException('No phone on account for SMS reset');
    }
    return true;
  }

  async resetPasswordWithOtp(
    emailOrPhone: string,
    code: string,
    password: string,
  ): Promise<boolean> {
    const isEmail = emailOrPhone.includes('@');
    const destination = emailOrPhone.trim();

    await this.otpService.verifyAndConsume(
      isEmail ? destination.toLowerCase() : destination,
      OtpPurpose.RESET_PASSWORD,
      code,
    );

    const user = await this.userService.findOneByEmailOrPhoneForTokens(
      emailOrPhone,
      emailOrPhone,
    );
    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.password = await bcrypt.hash(password, 10);
    user.editPasswordToken = null;
    user.editPasswordTokenExpiresAt = null;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await this.userService.saveUser(user);
    return true;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userService.findOneForTokens(userId);
    if (!user) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'User not found',
      });
    }

    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        error: true,
        message: 'Current password is incorrect',
      });
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'New password must be different from the current password',
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await this.userService.saveUser(user);
    await this.deviceService.clearAllFcmForUser(userId);
  }

  /** Super admin sets another user's password (no current password required). */
  async setPasswordForUser(userId: string, newPassword: string): Promise<void> {
    const user = await this.userService.findOneForTokens(userId);
    if (!user) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'User not found',
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await this.userService.saveUser(user);
    await this.deviceService.clearAllFcmForUser(userId);
  }

  async validateToken(token: string): Promise<Partial<User>> {
    const payload = await this.isTokenValid(token);
    if (payload?.type && payload.type !== 'access') {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        error: true,
        message: 'Access token required',
      });
    }

    if (payload) {
      const user = await this.userService.findOneForMe(payload.sub);
      if (user && user.tokenVersion === payload.tokenVersion) {
        const {
          password,
          editPasswordToken,
          phoneVerificationToken,
          emailVerificationToken,
          ...userData
        } = user;
        return userData;
      }
    }
    throw new UnauthorizedException({
      statusCode: HttpStatus.UNAUTHORIZED,
      error: true,
      message: 'Unauthorized',
    });
  }

  async validateGoogleUser(googleUser: any) {
    let user = await this.userService.findOneByEmailOrPhone(
      googleUser.email,
      googleUser.email,
    );

    if (!user) {
      const UserRole = await this.roleService.findByNameOrCreate('user');
      user = await this.userService.create({
        email: googleUser.email,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        profilePicture: googleUser.picture,
        phone: '',
        address: '',
        password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10),
        dateOfBirth: null,
        roles: [UserRole],
      });
      await this.userService.markEmailVerified(user.id);
      user.isEmailVerified = true;
    }

    const tokens = await this.issueTokenPair(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
      },
    };
  }
}
