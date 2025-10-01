import { Module } from '@nestjs/common';
import { ReservationRequestsController } from './reservation-requests.controller';
import { ReservationRequestsService } from './reservation-requests.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [ReservationRequestsController],
  providers: [ReservationRequestsService],
})
export class ReservationRequestsModule {}