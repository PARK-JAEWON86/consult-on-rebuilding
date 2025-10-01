import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReservationStatus } from '@prisma/client';

export interface ReservationRequestQuery {
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELED';
  expertId?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class ReservationRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async getReservationRequests(userId: number, query: ReservationRequestQuery) {
    console.log('🔍 getReservationRequests called with:', { userId, query });

    try {
      // 사용자가 전문가인지 확인
      const expert = await this.prisma.expert.findFirst({
        where: {
          userId: userId,
          isActive: true,
        },
      });

      console.log('👨‍💼 Expert found:', expert);

      if (!expert) {
        console.log('❌ No expert profile found for user:', userId);
        throw new ForbiddenException('전문가 프로필이 없습니다.');
      }

    const page = parseInt(query.page?.toString() || '1', 10);
    const limit = parseInt(query.limit?.toString() || '10', 10);
    const skip = (page - 1) * limit;

    const where = {
      expertId: expert.id,
      ...(query.status && { status: query.status as ReservationStatus }),
    };

    const [reservations, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.reservation.count({ where }),
    ]);

    // 기존 코드와의 호환성을 위해 client 필드 추가
    const reservationsWithUsers = reservations.map((reservation) => ({
      ...reservation,
      client: reservation.user, // 기존 코드와의 호환성을 위해
    }));

      return {
        data: reservationsWithUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('❌ Error in getReservationRequests:', error);
      throw error;
    }
  }

  async getReservationStats(userId: number) {
    // 사용자가 전문가인지 확인
    const expert = await this.prisma.expert.findFirst({
      where: {
        userId: userId,
        isActive: true,
      },
    });

    if (!expert) {
      throw new ForbiddenException('전문가 프로필이 없습니다.');
    }

    const [pending, confirmed, canceled, totalRevenue] = await Promise.all([
      this.prisma.reservation.count({
        where: { expertId: expert.id, status: 'PENDING' },
      }),
      this.prisma.reservation.count({
        where: { expertId: expert.id, status: 'CONFIRMED' },
      }),
      this.prisma.reservation.count({
        where: { expertId: expert.id, status: 'CANCELED' },
      }),
      this.prisma.reservation.aggregate({
        where: { expertId: expert.id, status: 'CONFIRMED' },
        _sum: { cost: true },
      }),
    ]);

    return {
      pending,
      confirmed,
      canceled,
      totalRevenue: totalRevenue._sum.cost || 0,
    };
  }

  async updateReservationStatus(
    reservationId: string,
    status: 'CONFIRMED' | 'CANCELED',
    userId: number,
    reason?: string,
  ) {
    // 예약이 존재하고 해당 전문가의 것인지 확인
    const reservation = await this.prisma.reservation.findUnique({
      where: { displayId: reservationId },
    });

    if (!reservation) {
      throw new NotFoundException('예약을 찾을 수 없습니다.');
    }

    // 전문가 확인
    const expert = await this.prisma.expert.findFirst({
      where: {
        userId: userId,
        isActive: true,
      },
    });

    if (!expert || reservation.expertId !== expert.id) {
      throw new ForbiddenException('해당 예약을 수정할 권한이 없습니다.');
    }

    // 예약 상태 업데이트
    const updatedReservation = await this.prisma.reservation.update({
      where: { displayId: reservationId },
      data: {
        status: status as ReservationStatus,
        updatedAt: new Date(),
        ...(reason && { note: reason }),
      },
    });

    // 알림 생성
    const user = await this.prisma.user.findUnique({
      where: { id: reservation.userId },
    });

    if (user) {
      await this.prisma.notification.create({
        data: {
          displayId: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: user.id,
          type: status === 'CONFIRMED' ? 'CONSULTATION_ACCEPTED' : 'CONSULTATION_REJECTED',
          title: status === 'CONFIRMED' ? '상담 예약이 승인되었습니다' : '상담 예약이 거절되었습니다',
          message: status === 'CONFIRMED'
            ? `${expert.name} 전문가와의 상담이 확정되었습니다.`
            : `${expert.name} 전문가가 상담 요청을 거절했습니다. ${reason ? `사유: ${reason}` : ''}`,
          data: {
            reservationId: reservation.displayId,
            expertId: expert.id,
            expertName: expert.name,
            reason,
          },
        },
      });
    }

    return {
      ...updatedReservation,
      user,
    };
  }

  async getReservationRequest(reservationId: string, userId: number) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { displayId: reservationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException('예약을 찾을 수 없습니다.');
    }

    // 전문가 확인
    const expert = await this.prisma.expert.findFirst({
      where: {
        userId: userId,
        isActive: true,
      },
    });

    if (!expert || reservation.expertId !== expert.id) {
      throw new ForbiddenException('해당 예약을 조회할 권한이 없습니다.');
    }

    return {
      ...reservation,
      client: reservation.user, // 기존 코드와의 호환성을 위해
    };
  }
}