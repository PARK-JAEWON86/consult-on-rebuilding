import { Controller, Post, Body, Delete, Param, Get, Query } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateReservationSchema } from './dto';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly svc: ReservationsService) {}

  @Post()
  async create(@Body(new ZodValidationPipe(CreateReservationSchema)) body: any) {
    // TODO: Idempotency-Key 지원 - 요청 헤더에서 Idempotency-Key를 읽어 Redis에 2~5분 캐싱하여 중복 POST 방지
    const data = await this.svc.create(body);
    return { success: true, data };
  }

  @Delete(':displayId')
  async cancel(@Param('displayId') displayId: string) {
    const data = await this.svc.cancel(displayId);
    return { success: true, data };
  }

  @Get()
  async list(@Query('userId') userId?: string) {
    if (!userId) return { success: true, data: [] };
    const data = await this.svc.listByUser(Number(userId));
    return { success: true, data };
  }
}
