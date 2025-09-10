import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ulid } from 'ulid';
import { TossClient } from './toss.client';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async createIntent(userId: number, amount: number, currency = process.env.CURRENCY || 'KRW') {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new BadRequestException({ 
        success: false, 
        error: { code: 'E_PAY_AMOUNT', message: 'Invalid amount' }
      });
    }
    
    const intent = await this.prisma.paymentIntent.create({
      data: { displayId: ulid(), userId, amount, currency, status: 'PENDING' },
      select: { displayId: true, amount: true, currency: true, status: true, createdAt: true },
    });
    return intent;
  }

  async getIntent(displayId: string) {
    const intent = await this.prisma.paymentIntent.findUnique({ where: { displayId } });
    if (!intent) {
      throw new NotFoundException({ 
        success: false, 
        error: { code: 'E_PAY_NOT_FOUND', message: 'Intent not found' }
      });
    }
    return intent;
  }

  async confirmWithToss(params: { paymentKey: string; orderId: string; amount: number }) {
    const intent = await this.prisma.paymentIntent.findUnique({ where: { displayId: params.orderId } });
    if (!intent) {
      throw new NotFoundException({ 
        success: false, 
        error: { code: 'E_PAY_NOT_FOUND', message: 'Intent not found' }
      });
    }
    
    // 멱등성 체크: 이미 성공한 경우 바로 반환
    if (intent.status === 'SUCCEEDED' || intent.providerKey) {
      return { ok: true };
    }
    
    if (intent.amount !== params.amount) {
      throw new BadRequestException({ 
        success: false, 
        error: { code: 'E_PAY_AMOUNT_MISMATCH', message: 'Amount mismatch' }
      });
    }

    const client = new TossClient(process.env.TOSS_SECRET_KEY!);
    const result = await client.confirmPayment({ 
      paymentKey: params.paymentKey, 
      orderId: params.orderId, 
      amount: params.amount 
    });

    try {
      await this.prisma.$transaction([
        this.prisma.paymentIntent.update({
          where: { id: intent.id },
          data: { status: 'SUCCEEDED', providerKey: params.paymentKey, metadata: result },
        }),
        this.prisma.creditTransaction.create({
          data: { 
            userId: intent.userId, 
            amount: intent.amount, 
            reason: 'charge:toss', 
            refId: intent.displayId 
          },
        }),
      ]);
    } catch (error: any) {
      // Prisma 유니크 제약 위반(P2002)은 멱등성으로 처리
      if (error?.code === 'P2002') {
        return { ok: true };
      }
      throw error;
    }

    return { ok: true };
  }
}
