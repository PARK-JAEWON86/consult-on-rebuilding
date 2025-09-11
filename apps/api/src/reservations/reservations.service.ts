import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { ulid } from 'ulid';

@Injectable()
export class ReservationsService {
  constructor(
    private prisma: PrismaService,
    private creditsService: CreditsService,
  ) {}

  async create(dto: { userId: number; expertId: number; startAt: string; endAt: string; note?: string }) {
    const start = new Date(dto.startAt);
    const end = new Date(dto.endAt);
    
    if (!(end > start)) {
      throw new BadRequestException({ 
        success: false, 
        error: { code: 'E_RES_TIME', message: 'endAt must be after startAt' }
      });
    }

    // 전문가 단가 조회
    const expert = await this.prisma.expert.findUnique({
      where: { id: dto.expertId },
      select: { ratePerMin: true }
    });

    if (!expert) {
      throw new BadRequestException({
        success: false,
        error: { code: 'E_EXPERT_NOT_FOUND', message: 'Expert not found' }
      });
    }

    // 예약 길이(분) 계산
    const durationMs = end.getTime() - start.getTime();
    const durationMin = Math.ceil(durationMs / 60_000); // 분 단위로 올림
    const cost = Math.max(0, Math.round(expert.ratePerMin * durationMin));

    // 사용자 잔액 확인
    const balance = await this.creditsService.getBalance(dto.userId);
    if (balance < cost) {
      throw new BadRequestException({
        success: false,
        error: { code: 'E_CREDIT_LACK', message: 'Insufficient credit' }
      });
    }

    const displayId = ulid();

    try {
      // 트랜잭션으로 예약 생성 + 크레딧 차감
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. 예약 생성
        const created = await tx.reservation.create({
          data: {
            displayId,
            userId: dto.userId,
            expertId: dto.expertId,
            startAt: start,
            endAt: end,
            cost,
            note: dto.note ?? null,
            status: 'PENDING',
          },
          select: { 
            displayId: true, 
            userId: true, 
            expertId: true, 
            startAt: true, 
            endAt: true, 
            cost: true,
            status: true 
          },
        });

        // 2. 크레딧 차감 기록
        await tx.creditTransaction.create({
          data: {
            userId: dto.userId,
            amount: -cost,
            reason: 'use:reservation',
            refId: displayId,
          },
        });

        return created;
      });

      return result;
    } catch (e: any) {
      // Prisma P2002 = Unique constraint failed
      if (e?.code === 'P2002') {
        // 시간 중복 또는 크레딧 트랜잭션 중복
        if (e.meta?.target?.includes('expertId') || e.meta?.target?.includes('startAt')) {
          throw new ConflictException({ 
            success: false, 
            error: { code: 'E_RES_CONFLICT', message: 'Time slot already reserved' }
          });
        }
        // 크레딧 트랜잭션 중복은 멱등적으로 처리 (이미 차감됨)
        const existing = await this.prisma.reservation.findUnique({
          where: { displayId },
          select: { 
            displayId: true, 
            userId: true, 
            expertId: true, 
            startAt: true, 
            endAt: true, 
            cost: true,
            status: true 
          },
        });
        if (existing) return existing;
      }
      throw e;
    }
  }

  async cancel(displayId: string) {
    const found = await this.prisma.reservation.findUnique({ 
      where: { displayId },
      select: { displayId: true, userId: true, cost: true, status: true }
    });
    
    if (!found) {
      throw new NotFoundException({ 
        success: false, 
        error: { code: 'E_RES_NOT_FOUND', message: 'Reservation not found' }
      });
    }

    // 이미 취소된 경우 멱등적으로 현재 상태 반환
    if (found.status === 'CANCELED') {
      return { displayId: found.displayId, status: found.status };
    }

    try {
      // 트랜잭션으로 예약 취소 + 크레딧 환불
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. 예약 상태 변경
        const updated = await tx.reservation.update({
          where: { displayId },
          data: { status: 'CANCELED' },
          select: { displayId: true, status: true },
        });

        // 2. 크레딧 환불 기록 (cost가 0보다 큰 경우만)
        if (found.cost > 0) {
          await tx.creditTransaction.create({
            data: {
              userId: found.userId,
              amount: found.cost,
              reason: 'refund:reservation',
              refId: found.displayId,
            },
          });
        }

        return updated;
      });

      return result;
    } catch (e: any) {
      // 유니크 충돌(P2002)이면 이미 환불 처리됨 (멱등)
      if (e?.code === 'P2002') {
        const existing = await this.prisma.reservation.findUnique({
          where: { displayId },
          select: { displayId: true, status: true },
        });
        if (existing) return existing;
      }
      throw e;
    }
  }

  async listByUser(userId: number) {
    return this.prisma.reservation.findMany({
      where: { userId, NOT: { status: 'CANCELED' } },
      orderBy: { createdAt: 'desc' },
      select: { 
        id: true,        // 추가: ensureSession에서 필요
        displayId: true, 
        expertId: true, 
        startAt: true, 
        endAt: true, 
        status: true, 
        cost: true,
        note: true 
      },
    });
  }
}
