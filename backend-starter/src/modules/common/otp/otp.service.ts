import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Otp } from './entities/otp.entity';
import { OtpPurpose, OtpType } from './enums';
import { MailService } from 'src/infra/mail/mail.service';
import { SmsService } from 'src/infra/sms/sms.service';
import { UserService } from 'src/modules/user/user.service';
import { ResendOtpDto, SendOtpDto, VerifyOtpDto } from './dto/otp.dto';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
    private readonly mailService: MailService,
    private readonly smsService: SmsService,
    private readonly userService: UserService,
  ) {}

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private resolveDestination(dto: {
    email?: string;
    phone?: string;
  }): { destination: string; otpType: OtpType } {
    if (dto.email) {
      return { destination: dto.email.toLowerCase().trim(), otpType: OtpType.EMAIL };
    }
    if (dto.phone) {
      return { destination: dto.phone.trim(), otpType: OtpType.PHONE };
    }
    throw new BadRequestException('Email or phone is required');
  }

  async send(dto: SendOtpDto, userId?: string): Promise<{ message: string }> {
    const { destination, otpType } = this.resolveDestination(dto);

    await this.otpRepository.update(
      { destination, purpose: dto.purpose, isUsed: false },
      { isUsed: true },
    );

    const code = this.generateCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const otp = this.otpRepository.create({
      code,
      destination,
      otpType,
      purpose: dto.purpose,
      userId,
      expiresAt,
      isUsed: false,
    });
    await this.otpRepository.save(otp);

    await this.deliver(otpType, destination, code, dto.purpose, userId);

    return {
      message:
        otpType === OtpType.EMAIL
          ? 'OTP sent to email'
          : 'OTP sent to phone',
    };
  }

  async resend(dto: ResendOtpDto, userId?: string) {
    return this.send({ ...dto, purpose: dto.purpose }, userId);
  }

  async verify(dto: VerifyOtpDto): Promise<{ valid: true; userId?: string }> {
    const { destination } = this.resolveDestination(dto);

    const otp = await this.otpRepository
      .createQueryBuilder('otp')
      .addSelect('otp.code')
      .where('otp.destination = :destination', { destination })
      .andWhere('otp.purpose = :purpose', { purpose: dto.purpose })
      .andWhere('otp.isUsed = false')
      .orderBy('otp.createdAt', 'DESC')
      .getOne();

    if (!otp) {
      throw new NotFoundException('OTP not found. Request a new one.');
    }

    if (otp.expiresAt < new Date()) {
      throw new BadRequestException('OTP has expired');
    }

    if (otp.code !== dto.code) {
      throw new BadRequestException('Invalid OTP code');
    }

    otp.isUsed = true;
    otp.verifiedAt = new Date();
    await this.otpRepository.save(otp);

    if (otp.userId) {
      if (
        dto.purpose === OtpPurpose.VERIFY_EMAIL ||
        dto.purpose === OtpPurpose.REGISTER
      ) {
        if (dto.email) {
          await this.userService.markEmailVerified(otp.userId);
        }
      }
      if (
        dto.purpose === OtpPurpose.VERIFY_PHONE ||
        (dto.purpose === OtpPurpose.REGISTER && dto.phone)
      ) {
        if (dto.phone) {
          await this.userService.markPhoneVerified(otp.userId);
        }
      }
    }

    return { valid: true, userId: otp.userId };
  }

  async verifyAndConsume(
    destination: string,
    purpose: OtpPurpose,
    code: string,
  ): Promise<Otp> {
    const otp = await this.otpRepository
      .createQueryBuilder('otp')
      .addSelect('otp.code')
      .where('otp.destination = :destination', { destination })
      .andWhere('otp.purpose = :purpose', { purpose })
      .andWhere('otp.isUsed = false')
      .orderBy('otp.createdAt', 'DESC')
      .getOne();

    if (!otp || otp.code !== code || otp.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    otp.isUsed = true;
    otp.verifiedAt = new Date();
    await this.otpRepository.save(otp);
    return otp;
  }

  private async deliver(
    otpType: OtpType,
    destination: string,
    code: string,
    purpose: OtpPurpose,
    userId?: string,
  ) {
    if (otpType === OtpType.EMAIL) {
      let name = 'User';
      if (userId) {
        const user = await this.userService.findOne(userId);
        if (user) name = user.firstName;
      }
      await this.mailService.sendMail(
        destination,
        `OTP: ${purpose}`,
        name,
        code,
      );
      return;
    }

    await this.smsService.sendOtp(destination, code, purpose);
  }
}
