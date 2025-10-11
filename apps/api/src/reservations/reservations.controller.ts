import { Controller, Post, Body, Delete, Param, Get, Query } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateReservationSchema } from './dto';
import { RequireIdempotencyKey } from '../common/decorators/idempotency-key.decorator';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly svc: ReservationsService) {}

  @Post()
  @RequireIdempotencyKey(300) // 5분 TTL
  async create(@Body(new ZodValidationPipe(CreateReservationSchema)) body: any) {
    const data = await this.svc.create(body);
    return { success: true, data };
  }

  @Delete(':displayId')
  async cancel(@Param('displayId') displayId: string, @Body() body?: { userId?: number }) {
    const data = await this.svc.cancel(displayId, body?.userId);
    return { success: true, data };
  }

  @Get()
  async list(@Query('userId') userId?: string, @Query('expertId') expertId?: string) {
    if (userId) {
      const data = await this.svc.listByUser(Number(userId));
      return { success: true, data };
    }
    if (expertId) {
      const data = await this.svc.listByExpert(Number(expertId));
      return { success: true, data };
    }
    return { success: true, data: [] };
  }

  @Post(':displayId/approve')
  async approve(@Param('displayId') displayId: string, @Body() body: { expertId: number }) {
    const data = await this.svc.approve(displayId, body.expertId);
    return { success: true, data };
  }

  @Post(':displayId/reject')
  async reject(
    @Param('displayId') displayId: string,
    @Body() body: { expertId: number; reason?: string }
  ) {
    const data = await this.svc.reject(displayId, body.expertId, body.reason);
    return { success: true, data };
  }

  @Get(':displayId/history')
  async getHistory(@Param('displayId') displayId: string) {
    const data = await this.svc.getReservationHistory(displayId);
    return { success: true, data };
  }
}
