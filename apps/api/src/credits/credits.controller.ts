import { Controller, Get, Query } from '@nestjs/common';
import { CreditsService } from './credits.service';

@Controller('credits')
export class CreditsController {
  constructor(private readonly svc: CreditsService) {}

  @Get('balance')
  async balance(@Query('userId') userId?: string) {
    const uid = Number(userId || 1); // TODO: Auth 연동 시 토큰에서 추출
    const balance = await this.svc.getBalance(uid);
    return { success: true, data: { userId: uid, balance } };
  }
}
