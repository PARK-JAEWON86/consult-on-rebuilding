import { Controller, Get, Post, Body, Param, Put, Query, UseGuards } from '@nestjs/common';
import { ReservationRequestsService } from './reservation-requests.service';
import { JwtGuard } from '../auth/jwt.guard';
import { User } from '../auth/user.decorator';
import { User as UserEntity } from '@prisma/client';

export interface ReservationRequestQuery {
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELED';
  expertId?: string;
  page?: number;
  limit?: number;
}

@Controller('reservation-requests')
@UseGuards(JwtGuard)
export class ReservationRequestsController {
  constructor(private readonly reservationRequestsService: ReservationRequestsService) {}

  @Get()
  async getReservationRequests(
    @User() user: { id: number; email: string },
    @Query() query: ReservationRequestQuery,
  ) {
    return this.reservationRequestsService.getReservationRequests(user.id, query);
  }

  @Get('stats')
  async getReservationStats(@User() user: { id: number; email: string }) {
    return this.reservationRequestsService.getReservationStats(user.id);
  }

  @Put(':id/status')
  async updateReservationStatus(
    @Param('id') reservationId: string,
    @Body() body: { status: 'CONFIRMED' | 'CANCELED'; reason?: string },
    @User() user: { id: number; email: string },
  ) {
    return this.reservationRequestsService.updateReservationStatus(
      reservationId,
      body.status,
      user.id,
      body.reason,
    );
  }

  @Get(':id')
  async getReservationRequest(
    @Param('id') reservationId: string,
    @User() user: { id: number; email: string },
  ) {
    return this.reservationRequestsService.getReservationRequest(reservationId, user.id);
  }
}