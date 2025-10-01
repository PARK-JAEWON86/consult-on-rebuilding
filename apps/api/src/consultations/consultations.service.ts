import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { convertIdToConsultationNumber } from '../utils/consultationNumber';

@Injectable()
export class ConsultationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getConsultationsByExpert(userId: number, query: any) {
    if (!userId) {
      return { items: [] };
    }

    // 먼저 사용자가 전문가인지 확인
    const expert = await this.prisma.expert.findFirst({
      where: { userId },
    });

    if (!expert) {
      return { items: [] };
    }

    // 전문가의 예약(상담) 목록 조회
    const reservations = await this.prisma.reservation.findMany({
      where: {
        expertId: expert.id,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        expert: {
          select: {
            specialty: true,
          },
        },
      },
      orderBy: {
        startAt: 'desc',
      },
    });

    // 프론트엔드 형식에 맞게 데이터 변환
    const consultationData = reservations.map((reservation) => {
      const specialty = expert.specialty || '일반상담';
      const consultationNumber = convertIdToConsultationNumber(
        reservation.id,
        reservation.startAt.toISOString(),
        specialty
      );

      // 상담 주제를 예약 노트에서 가져오거나 기본값 설정
      const topic = reservation.note || `${specialty} 상담`;

      // 상태 매핑
      let status: 'completed' | 'scheduled' | 'canceled';
      switch (reservation.status) {
        case 'CONFIRMED':
          status = new Date() > reservation.endAt ? 'completed' : 'scheduled';
          break;
        case 'CANCELED':
          status = 'canceled';
          break;
        default:
          status = 'scheduled';
      }

      return {
        id: reservation.id,
        consultationNumber,
        date: reservation.startAt.toISOString(),
        customer: reservation.user.name || '고객',
        topic,
        amount: reservation.cost,
        status,
        specialty,
      };
    });

    return {
      items: consultationData,
      total: consultationData.length,
    };
  }
}