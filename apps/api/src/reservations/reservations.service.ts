import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { ExpertLevelsService } from '../expert-levels/expert-levels.service';
import { ExpertStatsService } from '../experts/expert-stats.service';
import { MailService } from '../mail/mail.service';
import { ulid } from 'ulid';

@Injectable()
export class ReservationsService {
  constructor(
    private prisma: PrismaService,
    private creditsService: CreditsService,
    private expertLevelsService: ExpertLevelsService,
    private expertStatsService: ExpertStatsService,
    private mailService: MailService
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

    // 전문가 정보 조회 (user 정보 포함)
    const expert = await this.prisma.expert.findUnique({
      where: { id: dto.expertId },
      select: {
        name: true,
        hourlyRate: true,
        totalSessions: true,
        ratingAvg: true,
        experience: true,
        reviewCount: true,
        repeatClients: true,
        user: {
          select: { email: true, name: true }
        }
      }
    });

    if (!expert) {
      throw new BadRequestException({
        success: false,
        error: { code: 'E_EXPERT_NOT_FOUND', message: 'Expert not found' }
      });
    }

    // ✅ 1. 예약 가능 시간 검증
    await this.validateAvailability(dto.expertId, start, end);

    // ✅ 2. 시간 충돌 검증
    await this.checkTimeConflict(dto.expertId, start, end);

    // 전문가 레벨별 크레딧 계산 (실시간)
    const stats = {
      totalSessions: expert.totalSessions || 0,
      avgRating: expert.ratingAvg || 0,
      reviewCount: expert.reviewCount || 0,
      repeatClients: expert.repeatClients || 0,
      likeCount: 0
    };

    const rankingScore = this.expertLevelsService.calculateRankingScore(stats);
    const expertLevel = this.expertLevelsService.calculateLevelByScore(rankingScore);
    const creditsPerMinute = this.expertLevelsService.calculateCreditsByLevel(expertLevel);

    console.log(`전문가 ${dto.expertId} 레벨 정보: Lv.${expertLevel}, 크레딧/분: ${creditsPerMinute}`);

    // 예약 길이(분) 계산
    const durationMs = end.getTime() - start.getTime();
    const durationMin = Math.ceil(durationMs / 60_000); // 분 단위로 올림
    const cost = Math.max(0, Math.round(creditsPerMinute * durationMin));

    // 사용자 잔액 확인
    const balance = await this.creditsService.getBalance(dto.userId);
    if (balance < cost) {
      throw new BadRequestException({
        success: false,
        error: { code: 'E_CREDIT_LACK', message: 'Insufficient credit' }
      });
    }

    // 클라이언트 정보 조회
    const client = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { name: true }
    });

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

      // 전문가에게 이메일 알림 (비동기, non-blocking)
      if (expert.user?.email) {
        this.mailService
          .sendNewReservationNotification(
            expert.user.email,
            expert.name,
            client?.name || '고객',
            displayId,
            start,
            end,
            dto.note || null,
            cost
          )
          .catch(err => {
            console.error('[ReservationsService] 예약 알림 이메일 발송 실패:', err);
          });
      }

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

  async cancel(displayId: string, userId?: number) {
    const found = await this.prisma.reservation.findUnique({
      where: { displayId },
      select: {
        displayId: true,
        userId: true,
        expertId: true,
        cost: true,
        status: true,
        startAt: true,
        expert: {
          select: {
            cancellationPolicy: true
          }
        }
      }
    });

    if (!found) {
      throw new NotFoundException({
        success: false,
        error: { code: 'E_RES_NOT_FOUND', message: 'Reservation not found' }
      });
    }

    // 권한 확인 (요청한 사용자가 예약자인지 확인)
    if (userId && found.userId !== userId) {
      throw new BadRequestException({
        success: false,
        error: { code: 'E_UNAUTHORIZED', message: 'You can only cancel your own reservations' }
      });
    }

    // 이미 취소된 경우 멱등적으로 현재 상태 반환
    if (found.status === 'CANCELED') {
      return {
        displayId: found.displayId,
        status: found.status,
        refundAmount: 0,
        message: '이미 취소된 예약입니다.'
      };
    }

    // 취소 정책 적용: 예약 시작 시간까지 남은 시간 계산
    const now = new Date();
    const startAt = new Date(found.startAt);
    const hoursUntilStart = (startAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    // 취소 정책: 기본 24시간 (전문가 설정이 있으면 그것 사용)
    const cancellationHours = 24;

    let refundAmount = found.cost;
    let refundReason = 'refund:reservation';
    let cancelMessage = '예약이 취소되었습니다.';

    if (hoursUntilStart < 0) {
      // 이미 시작 시간이 지난 경우 - 취소 불가
      throw new BadRequestException({
        success: false,
        error: {
          code: 'E_CANCEL_TOO_LATE',
          message: '예약 시작 시간이 지나 취소할 수 없습니다.'
        }
      });
    } else if (hoursUntilStart < cancellationHours) {
      // 24시간 이내 취소: 50% 환불
      refundAmount = Math.floor(found.cost * 0.5);
      refundReason = 'refund:partial';
      cancelMessage = `취소 정책에 따라 ${cancellationHours}시간 이내 취소로 50% 환불됩니다.`;
    } else {
      // 24시간 이전 취소: 전액 환불
      refundAmount = found.cost;
      refundReason = 'refund:reservation';
      cancelMessage = '전액 환불됩니다.';
    }

    try {
      // 트랜잭션으로 예약 취소 + 크레딧 환불
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. 예약 상태 변경
        const updated = await tx.reservation.update({
          where: { displayId },
          data: {
            status: 'CANCELED',
            canceledAt: new Date(),
            canceledBy: userId || found.userId,
            cancelReason: cancelMessage,
            refundAmount: refundAmount
          },
          select: {
            id: true,
            displayId: true,
            status: true,
            canceledAt: true,
            refundAmount: true
          },
        });

        // 2. 크레딧 환불 기록 (환불 금액이 0보다 큰 경우만)
        if (refundAmount > 0) {
          await tx.creditTransaction.create({
            data: {
              userId: found.userId,
              amount: refundAmount,
              reason: refundReason,
              refId: found.displayId,
            },
          });
        }

        // 3. 히스토리 기록
        await tx.reservationHistory.create({
          data: {
            reservationId: updated.id,
            fromStatus: found.status,
            toStatus: 'CANCELED',
            changedBy: userId || found.userId,
            reason: cancelMessage
          }
        });

        return updated;
      });

      return {
        ...result,
        refundAmount,
        originalCost: found.cost,
        refundRate: Math.round((refundAmount / found.cost) * 100),
        message: cancelMessage,
        hoursUntilStart: Math.round(hoursUntilStart * 10) / 10
      };
    } catch (e: any) {
      // 유니크 충돌(P2002)이면 이미 환불 처리됨 (멱등)
      if (e?.code === 'P2002') {
        const existing = await this.prisma.reservation.findUnique({
          where: { displayId },
          select: { displayId: true, status: true },
        });
        if (existing) return { ...existing, refundAmount: 0, message: '이미 처리된 취소입니다.' };
      }
      throw e;
    }
  }

  async listByUser(userId: number) {
    return this.prisma.reservation.findMany({
      where: { userId, NOT: { status: 'CANCELED' } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        displayId: true,
        userId: true,
        expertId: true,
        startAt: true,
        endAt: true,
        status: true,
        cost: true,
        note: true,
        expert: {
          select: {
            name: true,
            displayId: true,
            avatarUrl: true
          }
        }
      },
    });
  }

  async listByExpert(expertId: number) {
    return this.prisma.reservation.findMany({
      where: { expertId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        displayId: true,
        userId: true,
        expertId: true,
        startAt: true,
        endAt: true,
        status: true,
        cost: true,
        note: true,
        user: {
          select: {
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      },
    });
  }

  /**
   * 예약 가능 시간 검증
   * 전문가가 설정한 근무 시간 내에 예약하는지 확인
   */
  private async validateAvailability(expertId: number, startAt: Date, endAt: Date) {
    // 요일 추출
    const dayOfWeek = this.getDayOfWeekEnum(startAt.getDay()) as any;
    const startTime = this.formatTime(startAt.getHours() * 60 + startAt.getMinutes());
    const endTime = this.formatTime(endAt.getHours() * 60 + endAt.getMinutes());

    // 전문가의 해당 요일 근무 시간 조회
    const availableSlots = await this.prisma.expertAvailability.findMany({
      where: {
        expertId,
        dayOfWeek,
        isActive: true
      }
    });

    if (availableSlots.length === 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'E_NOT_AVAILABLE_DAY',
          message: '전문가가 해당 요일에 상담을 제공하지 않습니다.'
        }
      });
    }

    // 예약 시간이 근무 시간 내에 포함되는지 확인
    const isWithinSlot = availableSlots.some(slot => {
      return startTime >= slot.startTime && endTime <= slot.endTime;
    });

    if (!isWithinSlot) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'E_NOT_AVAILABLE_TIME',
          message: '선택한 시간은 전문가의 예약 가능 시간이 아닙니다.',
          availableSlots: availableSlots.map(s => ({
            startTime: s.startTime,
            endTime: s.endTime
          }))
        }
      });
    }
  }

  /**
   * 시간 충돌 검증
   * 같은 전문가의 기존 예약과 시간이 겹치지 않는지 확인
   */
  private async checkTimeConflict(expertId: number, startAt: Date, endAt: Date, excludeId?: string) {
    const conflicts = await this.prisma.reservation.findFirst({
      where: {
        expertId,
        displayId: excludeId ? { not: excludeId } : undefined,
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          {
            // 기존 예약이 새 예약 시작 시간을 포함
            AND: [
              { startAt: { lte: startAt } },
              { endAt: { gt: startAt } }
            ]
          },
          {
            // 기존 예약이 새 예약 종료 시간을 포함
            AND: [
              { startAt: { lt: endAt } },
              { endAt: { gte: endAt } }
            ]
          },
          {
            // 새 예약이 기존 예약을 완전히 포함
            AND: [
              { startAt: { gte: startAt } },
              { endAt: { lte: endAt } }
            ]
          }
        ]
      },
      select: {
        displayId: true,
        startAt: true,
        endAt: true
      }
    });

    if (conflicts) {
      // 대체 시간 제안 생성
      const alternativeTimes = await this.suggestAlternativeTimes(expertId, startAt, endAt);

      throw new ConflictException({
        success: false,
        error: {
          code: 'E_TIME_CONFLICT',
          message: '해당 시간에 이미 예약이 있습니다.',
          conflictingReservation: {
            displayId: conflicts.displayId,
            startAt: conflicts.startAt.toISOString(),
            endAt: conflicts.endAt.toISOString()
          },
          alternativeTimes
        }
      });
    }
  }

  /**
   * 시간 충돌 시 대체 시간 제안
   * - 같은 날 이전/이후 시간대 3개씩 제안
   * - 예약 가능 시간 내에서만 제안
   */
  private async suggestAlternativeTimes(expertId: number, requestedStart: Date, requestedEnd: Date) {
    const duration = (requestedEnd.getTime() - requestedStart.getTime()) / (1000 * 60); // minutes
    const dayOfWeek = this.getDayOfWeekEnum(requestedStart.getDay()) as any;

    // 전문가의 해당 요일 예약 가능 시간 조회
    const availableSlots = await this.prisma.expertAvailability.findMany({
      where: { expertId, dayOfWeek, isActive: true },
      select: { startTime: true, endTime: true }
    });

    if (availableSlots.length === 0) {
      return [];
    }

    // 기존 예약 조회
    const existingReservations = await this.prisma.reservation.findMany({
      where: {
        expertId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        startAt: {
          gte: new Date(requestedStart.getFullYear(), requestedStart.getMonth(), requestedStart.getDate(), 0, 0, 0),
          lt: new Date(requestedStart.getFullYear(), requestedStart.getMonth(), requestedStart.getDate() + 1, 0, 0, 0)
        }
      },
      select: { startAt: true, endAt: true }
    });

    const alternatives: Array<{ startAt: string; endAt: string }> = [];
    const requestedHour = requestedStart.getHours();
    const requestedMinute = requestedStart.getMinutes();

    // 30분 단위로 가능한 시간대 탐색 (이전 3개, 이후 3개)
    for (let offset = -3; offset <= 3 && alternatives.length < 6; offset++) {
      if (offset === 0) continue; // 요청한 시간은 제외

      const newStart = new Date(requestedStart);
      newStart.setMinutes(requestedMinute + (offset * 30));

      const newEnd = new Date(newStart.getTime() + (duration * 60 * 1000));

      // 예약 가능 시간 내인지 확인
      const isInAvailableTime = availableSlots.some(slot => {
        const [slotStartHour, slotStartMin] = slot.startTime.split(':').map(Number);
        const [slotEndHour, slotEndMin] = slot.endTime.split(':').map(Number);

        const slotStartMinutes = slotStartHour * 60 + slotStartMin;
        const slotEndMinutes = slotEndHour * 60 + slotEndMin;
        const newStartMinutes = newStart.getHours() * 60 + newStart.getMinutes();
        const newEndMinutes = newEnd.getHours() * 60 + newEnd.getMinutes();

        return newStartMinutes >= slotStartMinutes && newEndMinutes <= slotEndMinutes;
      });

      if (!isInAvailableTime) continue;

      // 기존 예약과 충돌하지 않는지 확인
      const hasConflict = existingReservations.some(reservation => {
        return (
          (newStart >= reservation.startAt && newStart < reservation.endAt) ||
          (newEnd > reservation.startAt && newEnd <= reservation.endAt) ||
          (newStart <= reservation.startAt && newEnd >= reservation.endAt)
        );
      });

      if (!hasConflict) {
        alternatives.push({
          startAt: newStart.toISOString(),
          endAt: newEnd.toISOString()
        });
      }
    }

    return alternatives.slice(0, 6); // 최대 6개
  }

  /**
   * 요일 숫자를 Enum으로 변환
   * @param dayNum 0(일요일) ~ 6(토요일)
   */
  private getDayOfWeekEnum(dayNum: number): string {
    const mapping = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return mapping[dayNum];
  }

  /**
   * HH:MM 형식으로 시간 포맷
   */
  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * 예약 승인
   * @param displayId 예약 displayId
   * @param expertId 전문가 ID (권한 확인용)
   */
  async approve(displayId: string, expertId: number) {
    const reservation = await this.findAndValidateExpertOwnership(displayId, expertId);

    if (reservation.status !== 'PENDING') {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'E_INVALID_STATUS',
          message: `예약 상태가 PENDING이 아닙니다. 현재 상태: ${reservation.status}`
        }
      });
    }

    // 트랜잭션: 예약 승인 + 히스토리 기록
    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. 예약 승인
      const result = await tx.reservation.update({
        where: { displayId },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
          updatedAt: new Date()
        },
        select: {
          id: true,
          displayId: true,
          userId: true,
          expertId: true,
          startAt: true,
          endAt: true,
          status: true,
          cost: true,
          confirmedAt: true
        }
      });

      // 2. 히스토리 기록
      await tx.reservationHistory.create({
        data: {
          reservationId: result.id,
          fromStatus: reservation.status,
          toStatus: 'CONFIRMED',
          changedBy: expertId,
          reason: '전문가가 예약을 승인했습니다'
        }
      });

      return result;
    });

    // 트랜잭션 완료 후 응답시간 통계 업데이트 (비동기)
    this.expertStatsService.calculateAndUpdateResponseTime(expertId)
      .catch(err => {
        console.error('[ReservationsService] 응답시간 계산 실패:', err);
      });

    return updated;
  }

  /**
   * 예약 거절
   * @param displayId 예약 displayId
   * @param expertId 전문가 ID (권한 확인용)
   * @param reason 거절 사유 (선택)
   */
  async reject(displayId: string, expertId: number, reason?: string) {
    const reservation = await this.findAndValidateExpertOwnership(displayId, expertId);

    if (reservation.status !== 'PENDING') {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'E_INVALID_STATUS',
          message: `예약 상태가 PENDING이 아닙니다. 현재 상태: ${reservation.status}`
        }
      });
    }

    // 트랜잭션: 예약 거절 + 크레딧 환불 + 히스토리 기록
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. 예약 거절 처리
      const updated = await tx.reservation.update({
        where: { displayId },
        data: {
          status: 'REJECTED',
          cancelReason: reason || '전문가가 예약을 거절했습니다',
          canceledAt: new Date(),
          canceledBy: expertId,
          refundAmount: reservation.cost,
          updatedAt: new Date()
        },
        select: {
          id: true,
          displayId: true,
          userId: true,
          expertId: true,
          startAt: true,
          endAt: true,
          status: true,
          cost: true,
          cancelReason: true,
          refundAmount: true
        }
      });

      // 2. 크레딧 환불 (cost가 0보다 큰 경우만)
      if (reservation.cost > 0) {
        await tx.creditTransaction.create({
          data: {
            userId: reservation.userId,
            amount: reservation.cost,
            reason: 'refund:rejected',
            refId: displayId
          }
        });
      }

      // 3. 히스토리 기록
      await tx.reservationHistory.create({
        data: {
          reservationId: updated.id,
          fromStatus: reservation.status,
          toStatus: 'REJECTED',
          changedBy: expertId,
          reason: reason || '전문가가 예약을 거절했습니다'
        }
      });

      return updated;
    });

    return result;
  }

  /**
   * 예약 히스토리 조회
   * @param displayId 예약 displayId
   */
  async getReservationHistory(displayId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { displayId },
      select: { id: true }
    });

    if (!reservation) {
      throw new NotFoundException({
        success: false,
        error: { code: 'E_RES_NOT_FOUND', message: 'Reservation not found' }
      });
    }

    return this.prisma.reservationHistory.findMany({
      where: { reservationId: reservation.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        fromStatus: true,
        toStatus: true,
        changedBy: true,
        reason: true,
        createdAt: true
      }
    });
  }

  /**
   * 예약 조회 및 전문가 소유권 확인
   */
  private async findAndValidateExpertOwnership(displayId: string, expertId: number) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { displayId },
      select: {
        displayId: true,
        userId: true,
        expertId: true,
        startAt: true,
        endAt: true,
        status: true,
        cost: true,
        note: true
      }
    });

    if (!reservation) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'E_RESERVATION_NOT_FOUND',
          message: '예약을 찾을 수 없습니다.'
        }
      });
    }

    if (reservation.expertId !== expertId) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'E_UNAUTHORIZED',
          message: '이 예약에 대한 권한이 없습니다.'
        }
      });
    }

    return reservation;
  }
}
