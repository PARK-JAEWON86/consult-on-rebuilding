import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CreditsModule } from '../credits/credits.module';
import { ExpertLevelsModule } from '../expert-levels/expert-levels.module';
import { ExpertsModule } from '../experts/experts.module';
import { MailModule } from '../mail/mail.module';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { IdempotencyInterceptor } from '../common/interceptors/idempotency.interceptor';

@Module({
  imports: [CreditsModule, ExpertLevelsModule, ExpertsModule, MailModule],
  providers: [
    ReservationsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotencyInterceptor,
    },
  ],
  controllers: [ReservationsController],
})
export class ReservationsModule {}
