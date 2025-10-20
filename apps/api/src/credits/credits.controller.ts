import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { CreditsService } from './credits.service';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('credits')
export class CreditsController {
  constructor(private readonly svc: CreditsService) {}

  @Get('balance')
  @UseGuards(JwtGuard)
  async balance(@Request() req: any) {
    const userId = req.user.id;
    const balance = await this.svc.getBalance(userId);
    return { success: true, data: { balance } };
  }

  @Get('transactions')
  @UseGuards(JwtGuard)
  async transactions(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    const userId = req.user.id;
    const limitNum = Number(limit || 10);
    const offsetNum = Number(offset || 0);

    const transactions = await this.svc.getTransactions(userId, limitNum, offsetNum);

    // reason을 기반으로 type을 매핑
    const mappedTransactions = transactions.map(tx => {
      let type = 'USAGE';
      if (tx.amount > 0) {
        if (tx.reason.includes('충전') || tx.reason.includes('Charge') || tx.reason.includes('복구')) {
          type = 'PURCHASE';
        } else if (tx.reason.includes('환불') || tx.reason.includes('Refund')) {
          type = 'REFUND';
        }
      }
      return {
        ...tx,
        type
      };
    });

    return {
      success: true,
      data: mappedTransactions
    };
  }
}
