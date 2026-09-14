import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from 'src/shared/utils/Helper';
import { OtpPurpose, OtpType } from '../enums';

@Entity('otps')
@Index('IDX_otp_destination_purpose', ['destination', 'purpose'])
export class Otp extends BaseEntity {
  @Column({ select: false })
  code: string;

  @Column({ type: 'enum', enum: OtpType })
  otpType: OtpType;

  @Column({ type: 'enum', enum: OtpPurpose })
  purpose: OtpPurpose;

  /** Email address or phone number the OTP was sent to */
  @Column()
  destination: string;

  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  isUsed: boolean;

  @Column({ nullable: true })
  verifiedAt?: Date;
}
