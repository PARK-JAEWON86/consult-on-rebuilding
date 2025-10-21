import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { MONTHLY_FREE_TOKENS } from '../../config/ai-usage.config';

/**
 * ✅ Phase 3: 관리자 토큰 통계 대시보드
 *
 * 기능:
 * - 전체 사용자 토큰 사용 통계
 * - 상위 사용자 조회
 * - Redis 캐싱 (10분)
 * - 성능 최적화
 */
@Injectable()
export class TokenStatsService {
  private readonly logger = new Logger(TokenStatsService.name);
  private readonly CACHE_TTL = 600; // 10분 (초 단위)
  private readonly CACHE_KEY = 'admin:token:stats';

  constructor(
    private prisma: PrismaService,
    private redis: RedisService
  ) {}

  /**
   * 토큰 사용 통계 조회 (캐싱 적용)
   */
  async getTokenUsageStatistics() {
    try {
      // 1. 캐시 확인
      const cachedStr = await this.redis.get(this.CACHE_KEY);
      if (cachedStr) {
        this.logger.debug('캐시에서 통계 반환');
        return JSON.parse(cachedStr);
      }

      this.logger.log('통계 계산 시작');

      // 2. 전체 통계 계산
      const stats = await this.prisma.aIUsage.aggregate({
        _sum: {
          usedTokens: true,
          purchasedTokens: true,
          totalTokens: true,
        },
        _avg: {
          usedTokens: true,
        },
        _count: true,
      });

      // 3. 활성 사용자 수 (이번 달에 사용한 사용자)
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const activeUsersCount = await this.prisma.aIUsage.count({
        where: {
          usedTokens: { gt: 0 },
          monthlyResetDate: { gte: firstDayOfMonth },
        },
      });

      // 4. 상위 사용자 (100명)
      const topUsers = await this.prisma.aIUsage.findMany({
        select: {
          userId: true,
          usedTokens: true,
          purchasedTokens: true,
          totalTurns: true,
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
        orderBy: {
          usedTokens: 'desc',
        },
        take: 100,
      });

      // 5. 토큰 사용률 분포
      const allUsage = await this.prisma.aIUsage.findMany({
        select: {
          usedTokens: true,
          purchasedTokens: true,
        },
      });

      const distribution = {
        under50: 0,  // 0-50% 사용
        under80: 0,  // 50-80% 사용
        under90: 0,  // 80-90% 사용
        under95: 0,  // 90-95% 사용
        over95: 0,   // 95% 이상 사용
      };

      allUsage.forEach((usage) => {
        const total = MONTHLY_FREE_TOKENS + usage.purchasedTokens;
        const percent = (usage.usedTokens / total) * 100;

        if (percent < 50) distribution.under50++;
        else if (percent < 80) distribution.under80++;
        else if (percent < 90) distribution.under90++;
        else if (percent < 95) distribution.under95++;
        else distribution.over95++;
      });

      // 6. 결과 구성
      const result = {
        overview: {
          totalUsers: stats._count,
          activeUsers: activeUsersCount,
          totalUsedTokens: stats._sum.usedTokens || 0,
          totalPurchasedTokens: stats._sum.purchasedTokens || 0,
          averageUsedTokens: Math.round(stats._avg.usedTokens || 0),
        },
        distribution,
        topUsers: topUsers.map((user) => {
          const total = MONTHLY_FREE_TOKENS + user.purchasedTokens;
          const remaining = total - user.usedTokens;
          const usagePercent = (user.usedTokens / total) * 100;

          return {
            userId: user.userId,
            email: user.user.email,
            name: user.user.name,
            usedTokens: user.usedTokens,
            purchasedTokens: user.purchasedTokens,
            totalTurns: user.totalTurns,
            remaining,
            usagePercent: Math.round(usagePercent),
          };
        }),
        generatedAt: new Date().toISOString(),
      };

      // 7. 캐싱 (10분)
      await this.redis.setex(this.CACHE_KEY, this.CACHE_TTL, JSON.stringify(result));

      this.logger.log('통계 계산 완료 및 캐싱');

      return result;
    } catch (error) {
      this.logger.error('통계 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 특정 사용자의 상세 토큰 사용 내역
   */
  async getUserTokenDetails(userId: number) {
    const usage = await this.prisma.aIUsage.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            createdAt: true,
          },
        },
      },
    });

    if (!usage) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    // 최근 채팅 세션
    const recentSessions = await this.prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        totalTokens: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { messages: true },
        },
      },
    });

    const total = MONTHLY_FREE_TOKENS + usage.purchasedTokens;
    const remaining = total - usage.usedTokens;
    const usagePercent = (usage.usedTokens / total) * 100;

    return {
      user: {
        userId: usage.userId,
        email: usage.user.email,
        name: usage.user.name,
        joinedAt: usage.user.createdAt,
      },
      tokenUsage: {
        usedTokens: usage.usedTokens,
        purchasedTokens: usage.purchasedTokens,
        remainingTokens: remaining,
        usagePercent: Math.round(usagePercent),
        totalTurns: usage.totalTurns,
        totalTokens: usage.totalTokens,
        averageTokensPerTurn: usage.totalTurns > 0
          ? Math.round(usage.totalTokens / usage.totalTurns)
          : 0,
        monthlyResetDate: usage.monthlyResetDate,
      },
      recentSessions: recentSessions.map((session) => ({
        id: session.id,
        title: session.title,
        totalTokens: session.totalTokens,
        messageCount: session._count.messages,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      })),
    };
  }

  /**
   * 캐시 수동 초기화
   */
  async clearCache() {
    await this.redis.del(this.CACHE_KEY);
    this.logger.log('통계 캐시 초기화');
  }
}
