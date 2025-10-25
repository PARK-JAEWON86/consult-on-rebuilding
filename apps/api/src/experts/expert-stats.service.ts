import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpertStatsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 전문가의 평균 응답시간 계산 및 업데이트
   * @param expertId 전문가 ID
   * @returns 계산된 평균 응답시간 (분) 또는 null
   */
  async calculateAndUpdateResponseTime(expertId: number): Promise<number | null> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. 문의 응답시간 계산 (최근 30일)
    const inquiryResponses = await this.prisma.inquiry.findMany({
      where: {
        expertId,
        createdAt: { gte: thirtyDaysAgo },
        reply: { isNot: null }
      },
      include: { reply: true }
    });

    const inquiryResponseTimes = inquiryResponses
      .map(inq => {
        const diffMs = inq.reply!.createdAt.getTime() - inq.createdAt.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return diffMinutes;
      })
      .filter(minutes => minutes > 0 && minutes <= 20160); // 최대 14일 (이상치 제거)

    // 2. 예약 확정 응답시간 계산 (최근 30일)
    const reservationResponses = await this.prisma.reservation.findMany({
      where: {
        expertId,
        createdAt: { gte: thirtyDaysAgo },
        status: 'CONFIRMED',
        confirmedAt: { not: null }
      }
    });

    const reservationResponseTimes = reservationResponses
      .map(res => {
        const diffMs = res.confirmedAt!.getTime() - res.createdAt.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return diffMinutes;
      })
      .filter(minutes => minutes > 0 && minutes <= 20160); // 최대 14일

    // 3. 정확한 가중평균 계산
    const inquiryCount = inquiryResponseTimes.length;
    const reservationCount = reservationResponseTimes.length;

    // 최소 3개 샘플 필요
    if (inquiryCount + reservationCount < 3) {
      return null;
    }

    let avgMinutes: number;

    if (inquiryCount > 0 && reservationCount > 0) {
      // 둘 다 데이터가 있을 때: 가중평균 (문의 70%, 예약 30%)
      const avgInquiry = inquiryResponseTimes.reduce((sum, t) => sum + t, 0) / inquiryCount;
      const avgReservation = reservationResponseTimes.reduce((sum, t) => sum + t, 0) / reservationCount;
      avgMinutes = Math.round(avgInquiry * 0.7 + avgReservation * 0.3);
    } else if (inquiryCount > 0) {
      // 문의 데이터만 있을 때
      avgMinutes = Math.round(
        inquiryResponseTimes.reduce((sum, t) => sum + t, 0) / inquiryCount
      );
    } else {
      // 예약 데이터만 있을 때
      avgMinutes = Math.round(
        reservationResponseTimes.reduce((sum, t) => sum + t, 0) / reservationCount
      );
    }

    // 4. Expert 모델 업데이트
    await this.prisma.expert.update({
      where: { id: expertId },
      data: {
        avgResponseTimeMinutes: avgMinutes,
        responseTimeCalculatedAt: new Date(),
        responseTimeSampleSize: inquiryCount + reservationCount
      }
    });

    return avgMinutes;
  }

  /**
   * 분 단위 응답시간을 사람이 읽기 쉬운 문자열로 변환
   */
  formatResponseTime(minutes: number | null): string {
    if (minutes === null) {
      return '응답 시간 미측정';
    }

    if (minutes <= 60) return '1시간 내';
    if (minutes <= 120) return '2시간 내';
    if (minutes <= 360) return '6시간 내';
    if (minutes <= 720) return '12시간 내';
    if (minutes <= 1440) return '1일 내';
    if (minutes <= 2880) return '2일 내';
    if (minutes <= 10080) return '3-7일';
    return '7일 이상';
  }

  /**
   * 전문가의 응답시간 통계 조회
   */
  async getResponseTimeStats(expertId: number) {
    const expert = await this.prisma.expert.findUnique({
      where: { id: expertId },
      select: {
        avgResponseTimeMinutes: true,
        responseTimeCalculatedAt: true,
        responseTimeSampleSize: true,
        responseTime: true // 수동 설정값 (fallback)
      }
    });

    if (!expert) {
      throw new NotFoundException('전문가를 찾을 수 없습니다.');
    }

    return {
      avgResponseTimeMinutes: expert.avgResponseTimeMinutes,
      formattedResponseTime: expert.avgResponseTimeMinutes
        ? this.formatResponseTime(expert.avgResponseTimeMinutes)
        : expert.responseTime, // fallback to manual value
      calculatedAt: expert.responseTimeCalculatedAt,
      sampleSize: expert.responseTimeSampleSize,
      isCalculated: expert.avgResponseTimeMinutes !== null
    };
  }
}
