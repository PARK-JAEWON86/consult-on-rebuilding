import { Module } from '@nestjs/common';
import { CreditsModule } from '../credits/credits.module';
import { ExpertLevelsModule } from '../expert-levels/expert-levels.module';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';

@Module({
  imports: [CreditsModule, ExpertLevelsModule],
  providers: [ReservationsService],
  controllers: [ReservationsController],
})
export class ReservationsModule {}
