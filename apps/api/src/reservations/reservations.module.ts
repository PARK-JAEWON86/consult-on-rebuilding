import { Module } from '@nestjs/common';
import { CreditsModule } from '../credits/credits.module';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';

@Module({
  imports: [CreditsModule],
  providers: [ReservationsService],
  controllers: [ReservationsController],
})
export class ReservationsModule {}
