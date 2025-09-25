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

  @Get('transactions')
  async transactions(
    @Query('userId') userId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    const uid = Number(userId || 1); // TODO: Auth 연동 시 토큰에서 추출
    const limitNum = Number(limit || 10);
    const offsetNum = Number(offset || 0);

    const transactions = await this.svc.getTransactions(uid, limitNum, offsetNum);
    return {
      success: true,
      data: {
        userId: uid,
        transactions,
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          count: transactions.length
        }
      }
    };
  }
}
