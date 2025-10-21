import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MONTHLY_FREE_TOKENS } from '../config/ai-usage.config';
import { ulid } from 'ulid';

/**
 * ✅ Phase 2: 토큰 부족 알림 배치 시스템
 *
 * 기능:
 * - 매시간 전체 사용자의 토큰 사용률 체크
 * - 80%, 90% 임계값 도달 시 알림 생성
 * - 24시간 내 중복 알림 방지
 */
@Injectable()
export class TokenNotificationScheduler {
  private readonly logger = new Logger(TokenNotificationScheduler.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 매시간 정각에 토큰 부족 사용자 체크 및 알림
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkTokenThresholds() {
    this.logger.log('토큰 임계값 체크 시작');

    try {
      // 1. 모든 사용자의 AI 사용량 조회
      const allUsage = await this.prisma.aIUsage.findMany({
        select: {
          userId: true,
          usedTokens: true,
          purchasedTokens: true,
          monthlyResetDate: true,
        },
      });

      let notificationsSent = 0;
      let warnings = 0;
      let critical = 0;

      // 2. 각 사용자별 토큰 사용률 계산 및 알림
      for (const usage of allUsage) {
        const totalAvailable = MONTHLY_FREE_TOKENS + usage.purchasedTokens;
        const usagePercent = (usage.usedTokens / totalAvailable) * 100;

        // 90% 이상 사용 (Critical)
        if (usagePercent >= 90 && usagePercent < 105) {
          const sent = await this.sendTokenWarningNotification(
            usage.userId,
            usagePercent >= 95 ? 'CRITICAL' : 'WARNING',
            usagePercent,
            totalAvailable - usage.usedTokens
          );
          if (sent) {
            notificationsSent++;
            if (usagePercent >= 95) critical++;
            else warnings++;
          }
        }
      }

      this.logger.log(
        `토큰 임계값 체크 완료 - 총 ${allUsage.length}명 체크, ` +
        `알림 ${notificationsSent}건 발송 (경고: ${warnings}, 긴급: ${critical})`
      );
    } catch (error) {
      this.logger.error('토큰 임계값 체크 중 오류 발생:', error);
    }
  }

  /**
   * 토큰 부족 알림 발송 (중복 방지 포함)
   */
  private async sendTokenWarningNotification(
    userId: number,
    level: 'WARNING' | 'CRITICAL',
    usagePercent: number,
    remainingTokens: number
  ): Promise<boolean> {
    try {
      // 중복 방지: 24시간 내 동일 레벨 알림이 있는지 체크
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const recentNotification = await this.prisma.notification.findFirst({
        where: {
          userId,
          type: level === 'CRITICAL' ? 'CREDIT_LOW' : 'CREDIT_LOW',
          createdAt: {
            gte: twentyFourHoursAgo,
          },
          // priority로 레벨 구분
          priority: level === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
        },
      });

      // 이미 알림을 보낸 경우 스킵
      if (recentNotification) {
        return false;
      }

      // 알림 생성
      const estimatedTurns = Math.floor(remainingTokens / 900);
      const remainingPercent = Math.round(100 - usagePercent);

      await this.prisma.notification.create({
        data: {
          displayId: ulid(),
          userId,
          type: 'CREDIT_LOW',
          priority: level === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
          title: level === 'CRITICAL'
            ? '⚠️ AI 채팅 토큰이 거의 소진되었습니다!'
            : '🔔 AI 채팅 토큰이 부족합니다',
          message: level === 'CRITICAL'
            ? `토큰이 ${remainingPercent}% 남았습니다. 곧 AI 채팅 사용이 제한됩니다. 토큰을 구매해주세요. (남은 토큰: ${remainingTokens.toLocaleString()}, 약 ${estimatedTurns}턴)`
            : `토큰이 ${remainingPercent}% 남았습니다. 원활한 사용을 위해 토큰 구매를 권장합니다. (남은 토큰: ${remainingTokens.toLocaleString()}, 약 ${estimatedTurns}턴)`,
          actionUrl: '/credits',
          data: {
            level,
            usagePercent: Math.round(usagePercent),
            remainingTokens,
            estimatedTurns,
          },
        },
      });

      this.logger.debug(
        `토큰 경고 알림 발송: userId=${userId}, level=${level}, usagePercent=${Math.round(usagePercent)}%`
      );

      return true;
    } catch (error) {
      this.logger.error(`알림 발송 실패 (userId: ${userId}):`, error);
      return false;
    }
  }
}
