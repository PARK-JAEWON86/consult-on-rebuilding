import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettlementSummary, ConsultationItem, MonthlyStats, SettlementResponse } from './settlements.dto';

@Injectable()
export class SettlementsService {
  constructor(private prisma: PrismaService) {}

  // 정산 일정 계산
  private getNextSettlementDate(): Date {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();

    if (currentDay >= 5) {
      return new Date(currentYear, currentMonth + 1, 5);
    } else {
      return new Date(currentYear, currentMonth, 5);
    }
  }

  private getDaysUntilSettlement(): number {
    const today = new Date();
    const nextSettlement = this.getNextSettlementDate();
    const diffTime = nextSettlement.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // 전문가의 완료된 상담 목록 조회
  async getExpertConsultations(expertId: number): Promise<ConsultationItem[]> {
    try {
      // 예약 → 세션 → 완료된 상담 데이터 조회
      const completedReservations = await this.prisma.reservation.findMany({
        where: {
          expertId: expertId,
          status: 'CONFIRMED',
          // 세션이 완료된 것들만
          endAt: {
            lt: new Date()
          }
        },
        // include는 릴레이션 설정 후 추가
        orderBy: {
          startAt: 'desc'
        }
      });

      // 임시로 더미 데이터 + 실제 데이터 혼합
      const consultations: ConsultationItem[] = [
        {
          id: 1,
          date: '2024-01-15',
          customer: '김철수',
          topic: '심리 상담',
          amount: 5000,
          status: 'completed'
        },
        {
          id: 2,
          date: '2024-01-18',
          customer: '박영희',
          topic: '법률 자문',
          amount: 8000,
          status: 'completed'
        },
        {
          id: 3,
          date: '2024-01-20',
          customer: '이민수',
          topic: '재무 설계',
          amount: 12000,
          status: 'completed'
        }
      ];

      // 실제 예약 데이터를 consultation으로 변환
      const realConsultations: ConsultationItem[] = completedReservations.map((reservation, index) => ({
        id: reservation.id,
        date: reservation.startAt.toISOString().split('T')[0],
        customer: `고객 ${index + 1}`, // 실제로는 User 테이블 조인 필요
        topic: '전문 상담',
        amount: reservation.cost,
        status: 'completed' as const
      }));

      return [...consultations, ...realConsultations];
    } catch (error) {
      console.error('Error fetching expert consultations:', error);
      // 에러 시 더미 데이터 반환
      return [
        {
          id: 1,
          date: '2024-01-15',
          customer: '김철수',
          topic: '심리 상담',
          amount: 5000,
          status: 'completed'
        },
        {
          id: 2,
          date: '2024-01-18',
          customer: '박영희',
          topic: '법률 자문',
          amount: 8000,
          status: 'completed'
        }
      ];
    }
  }

  // 정산 요약 정보 계산
  async getSettlementSummary(expertId: number): Promise<SettlementSummary> {
    try {
      const consultations = await this.getExpertConsultations(expertId);
      const completed = consultations.filter(c => c.status === 'completed');

      const totalGrossCredits = completed.reduce((sum, c) => sum + c.amount, 0);
      const totalGrossKrw = totalGrossCredits * 10; // 1 크레딧 = 10원
      const platformFeeRate = 0.12; // 12% 수수료
      const totalPlatformFeeKrw = Math.round(totalGrossKrw * platformFeeRate);
      const taxWithheldKrw = Math.round(totalGrossKrw * 0.033); // 3.3% 원천징수
      const netPayoutCredits = totalGrossCredits - Math.round(totalPlatformFeeKrw / 10);

      return {
        totalConsultations: completed.length,
        totalGrossCredits,
        totalGrossKrw,
        totalPlatformFeeKrw,
        taxWithheldKrw,
        netPayoutCredits,
        avgDurationMin: 45 // 임시값, 실제로는 세션 데이터에서 계산
      };
    } catch (error) {
      console.error('Error calculating settlement summary:', error);
      // 에러 시 더미 데이터 반환
      return {
        totalConsultations: 25,
        totalGrossCredits: 125000,
        totalGrossKrw: 1250000,
        totalPlatformFeeKrw: 150000,
        taxWithheldKrw: 50000,
        netPayoutCredits: 110000,
        avgDurationMin: 45
      };
    }
  }

  // 월별 통계 계산
  async getMonthlyStats(expertId: number, year: number): Promise<MonthlyStats[]> {
    try {
      const consultations = await this.getExpertConsultations(expertId);
      const completed = consultations.filter(c => c.status === 'completed');

      // 해당 연도 데이터만 필터
      const yearData = completed.filter(c => {
        const date = new Date(c.date);
        return date.getFullYear() === year;
      });

      const monthlyData: MonthlyStats[] = [];
      const platformFeeRate = 0.12;

      for (let month = 1; month <= 12; month++) {
        const monthData = yearData.filter(c => {
          const date = new Date(c.date);
          return date.getMonth() === month - 1;
        });

        const gross = monthData.reduce((sum, c) => sum + c.amount, 0);
        const fee = Math.round(gross * platformFeeRate);
        const net = gross - fee;
        const consultationCount = monthData.length;

        monthlyData.push({
          month,
          label: `${year}년 ${month}월`,
          gross,
          fee,
          net,
          consultationCount
        });
      }

      return monthlyData;
    } catch (error) {
      console.error('Error calculating monthly stats:', error);
      // 에러 시 빈 배열 반환
      return Array.from({ length: 12 }, (_, index) => ({
        month: index + 1,
        label: `${year}년 ${index + 1}월`,
        gross: 0,
        fee: 0,
        net: 0,
        consultationCount: 0
      }));
    }
  }

  // 전체 정산 데이터 조회
  async getExpertSettlements(expertId: number): Promise<SettlementResponse> {
    try {
      const currentYear = new Date().getFullYear();

      const [summary, consultations, monthlyStats] = await Promise.all([
        this.getSettlementSummary(expertId),
        this.getExpertConsultations(expertId),
        this.getMonthlyStats(expertId, currentYear)
      ]);

      return {
        summary,
        consultations,
        monthlyStats,
        nextSettlementDate: this.getNextSettlementDate().toISOString(),
        daysUntilSettlement: this.getDaysUntilSettlement()
      };
    } catch (error) {
      console.error('Error fetching expert settlements:', error);
      throw new Error('정산 데이터 조회에 실패했습니다.');
    }
  }

  // 전문가 존재 여부 확인
  async checkExpertExists(expertId: number): Promise<boolean> {
    try {
      const expert = await this.prisma.expert.findUnique({
        where: { id: expertId },
        select: { id: true }
      });
      return !!expert;
    } catch (error) {
      console.error('Error checking expert existence:', error);
      return false;
    }
  }
}