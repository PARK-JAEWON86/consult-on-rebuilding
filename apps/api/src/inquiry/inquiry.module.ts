import { Module } from '@nestjs/common';
import { InquiryController } from './inquiry.controller';
import { InquiryService } from './inquiry.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ExpertsModule } from '../experts/experts.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [PrismaModule, AuthModule, ExpertsModule, MailModule],
  controllers: [InquiryController],
  providers: [InquiryService],
  exports: [InquiryService]
})
export class InquiryModule {}
