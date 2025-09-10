import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CreditsService {
  constructor(private prisma: PrismaService) {}

  async getBalance(userId: number) {
    const agg = await this.prisma.creditTransaction.aggregate({
      _sum: { amount: true },
      where: { userId },
    });
    return agg._sum.amount ?? 0;
  }

  // 음수/양수 트랜잭션 기록 (유니크 충돌시 멱등 처리)
  async record(userId: number, amount: number, reason: string, refId?: string) {
    try {
      await this.prisma.creditTransaction.create({
        data: { userId, amount, reason, refId },
      });
    } catch (e: any) {
      if (e?.code !== 'P2002') throw e; // 유니크 충돌만 멱등 허용
    }
  }
}
