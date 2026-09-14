import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Otp } from './entities/otp.entity';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { MailModule } from 'src/infra/mail/mail.module';
import { SmsModule } from 'src/infra/sms/sms.module';
import { UserModule } from 'src/modules/user/user.module';
import { AuthModule } from 'src/modules/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Otp]),
    MailModule,
    SmsModule,
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [OtpController],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
