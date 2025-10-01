import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('consultations')
@UseGuards(JwtGuard)
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @Get()
  async getConsultations(@Request() req: any, @Query() query: any) {
    const userId = req.user?.id;
    const data = await this.consultationsService.getConsultationsByExpert(userId, query);
    return { success: true, data };
  }
}