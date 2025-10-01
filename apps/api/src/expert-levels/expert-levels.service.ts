import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// 타입 정의
export interface LevelTier {
  name: string;
  levelRange: { min: number; max: number };
  scoreRange: { min: number; max: number };
  creditsPerMinute: number;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

export interface ExpertStats {
  totalSessions?: number;
  avgRating?: number;
  reviewCount?: number;
  repeatClients?: number;
  likeCount?: number;
}

// 레벨 기반 티어 시스템 (Lv.1~999 범위) - 상위 티어로 갈수록 진급 어려워짐
const TIER_SYSTEM: LevelTier[] = [
  {
    name: "Mythical (미시컬)",
    levelRange: { min: 950, max: 999 },
    scoreRange: { min: 950, max: 999 },
    creditsPerMinute: 800,
    color: "from-purple-600 via-pink-600 to-red-600",
    bgColor: "bg-gradient-to-r from-purple-600 via-pink-600 to-red-600",
    textColor: "text-white",
    borderColor: "border-purple-600",
  },
  {
    name: "Legend (레전드)",
    levelRange: { min: 850, max: 949 },
    scoreRange: { min: 850, max: 949 },
    creditsPerMinute: 600,
    color: "from-red-600 to-pink-700",
    bgColor: "bg-gradient-to-r from-red-600 to-pink-700",
    textColor: "text-white",
    borderColor: "border-red-600",
  },
  {
    name: "Champion (챔피언)",
    levelRange: { min: 750, max: 849 },
    scoreRange: { min: 750, max: 849 },
    creditsPerMinute: 500,
    color: "from-purple-600 to-indigo-700",
    bgColor: "bg-gradient-to-r from-purple-600 to-indigo-700",
    textColor: "text-white",
    borderColor: "border-purple-600",
  },
  {
    name: "Grandmaster (그랜드마스터)",
    levelRange: { min: 600, max: 749 },
    scoreRange: { min: 600, max: 749 },
    creditsPerMinute: 450,
    color: "from-indigo-600 to-blue-700",
    bgColor: "bg-gradient-to-r from-indigo-600 to-blue-700",
    textColor: "text-white",
    borderColor: "border-indigo-600",
  },
  {
    name: "Master (마스터)",
    levelRange: { min: 450, max: 599 },
    scoreRange: { min: 450, max: 599 },
    creditsPerMinute: 400,
    color: "from-blue-600 to-cyan-700",
    bgColor: "bg-gradient-to-r from-blue-600 to-cyan-700",
    textColor: "text-white",
    borderColor: "border-blue-600",
  },
  {
    name: "Diamond (다이아몬드)",
    levelRange: { min: 300, max: 449 },
    scoreRange: { min: 300, max: 449 },
    creditsPerMinute: 350,
    color: "from-cyan-600 to-teal-700",
    bgColor: "bg-gradient-to-r from-cyan-600 to-teal-700",
    textColor: "text-white",
    borderColor: "border-cyan-600",
  },
  {
    name: "Platinum (플래티넘)",
    levelRange: { min: 200, max: 299 },
    scoreRange: { min: 200, max: 299 },
    creditsPerMinute: 300,
    color: "from-teal-600 to-green-700",
    bgColor: "bg-gradient-to-r from-teal-600 to-green-700",
    textColor: "text-white",
    borderColor: "border-teal-600",
  },
  {
    name: "Gold (골드)",
    levelRange: { min: 120, max: 199 },
    scoreRange: { min: 120, max: 199 },
    creditsPerMinute: 250,
    color: "from-green-600 to-emerald-700",
    bgColor: "bg-gradient-to-r from-green-600 to-emerald-700",
    textColor: "text-white",
    borderColor: "border-green-600",
  },
  {
    name: "Silver (실버)",
    levelRange: { min: 70, max: 119 },
    scoreRange: { min: 70, max: 119 },
    creditsPerMinute: 200,
    color: "from-emerald-600 to-lime-700",
    bgColor: "bg-gradient-to-r from-emerald-600 to-lime-700",
    textColor: "text-white",
    borderColor: "border-emerald-600",
  },
  {
    name: "Bronze (브론즈)",
    levelRange: { min: 30, max: 69 },
    scoreRange: { min: 30, max: 69 },
    creditsPerMinute: 150,
    color: "from-lime-600 to-yellow-700",
    bgColor: "bg-gradient-to-r from-lime-600 to-yellow-700",
    textColor: "text-white",
    borderColor: "border-lime-600",
  },
  {
    name: "Iron (아이언)",
    levelRange: { min: 1, max: 29 },
    scoreRange: { min: 1, max: 29 },
    creditsPerMinute: 120,
    color: "from-yellow-600 to-orange-700",
    bgColor: "bg-gradient-to-r from-yellow-600 to-orange-700",
    textColor: "text-white",
    borderColor: "border-yellow-600",
  },
];

@Injectable()
export class ExpertLevelsService {
  constructor(private prisma: PrismaService) {}

  // 개선된 점수 계산 공식 (무제한 점수 체계)
  calculateRankingScore(stats: ExpertStats): number {
    const totalSessions = stats.totalSessions || 0;
    const avgRating = stats.avgRating || 0;
    const reviewCount = stats.reviewCount || 0;
    const repeatClients = stats.repeatClients || 0;
    const likeCount = stats.likeCount || 0;

    // 입력값 검증
    if (totalSessions < 0 || avgRating < 0 || avgRating > 5 || repeatClients > totalSessions) {
      return 0;
    }

    // 1. 상담 횟수 점수 (무제한 증가, 더 엄격하게)
    const sessionScore = (totalSessions / 8) * 0.25 * 100; // 8회당 1점

    // 2. 평점 점수 (5점 만점 기준)
    const ratingScore = (avgRating / 5) * 0.35 * 100;

    // 3. 리뷰 수 점수 (무제한 증가, 더 엄격하게)
    const reviewScore = (reviewCount / 4) * 0.15 * 100; // 4개당 1점

    // 4. 재방문 고객 비율 점수
    const repeatRate = totalSessions > 0 ? repeatClients / totalSessions : 0;
    const repeatScore = repeatRate * 0.20 * 100;

    // 5. 좋아요 수 점수 (무제한 증가, 더 엄격하게)
    const likeScore = (likeCount / 10) * 0.05 * 100; // 10개당 1점

    const totalScore = sessionScore + ratingScore + reviewScore + repeatScore + likeScore;
    return Math.round(totalScore * 100) / 100;
  }

  // 랭킹 점수를 기반으로 레벨 계산 (목표: 100회 상담 = 골드 티어 150레벨)
  calculateLevelByScore(rankingScore: number = 0): number {
    if (rankingScore <= 0) return 1;

    // 목표 기준: 100회 상담 (약 660점) → 골드 티어 (~174레벨)

    // 점수 대비 레벨 매핑 (더 현실적인 스케일링)
    let level;

    if (rankingScore <= 100) {
      // Iron 티어 (1-29): 0-100점
      level = Math.round(1 + (rankingScore / 100) * 28);
    } else if (rankingScore <= 200) {
      // Bronze 티어 (30-69): 100-200점
      level = Math.round(30 + ((rankingScore - 100) / 100) * 39);
    } else if (rankingScore <= 350) {
      // Silver 티어 (70-119): 200-350점
      level = Math.round(70 + ((rankingScore - 200) / 150) * 49);
    } else if (rankingScore <= 800) {
      // Gold 티어 (120-199): 350-800점 (100회 상담 660점이 여기 포함)
      level = Math.round(120 + ((rankingScore - 350) / 450) * 79);
    } else if (rankingScore <= 1200) {
      // Platinum 티어 (200-299): 800-1200점
      level = Math.round(200 + ((rankingScore - 800) / 400) * 99);
    } else if (rankingScore <= 1600) {
      // Diamond 티어 (300-449): 1200-1600점
      level = Math.round(300 + ((rankingScore - 1200) / 400) * 149);
    } else if (rankingScore <= 2000) {
      // Master 티어 (450-599): 1600-2000점
      level = Math.round(450 + ((rankingScore - 1600) / 400) * 149);
    } else if (rankingScore <= 2500) {
      // Grandmaster 티어 (600-749): 2000-2500점
      level = Math.round(600 + ((rankingScore - 2000) / 500) * 149);
    } else if (rankingScore <= 3000) {
      // Champion 티어 (750-849): 2500-3000점
      level = Math.round(750 + ((rankingScore - 2500) / 500) * 99);
    } else if (rankingScore <= 4000) {
      // Legend 티어 (850-949): 3000-4000점
      level = Math.round(850 + ((rankingScore - 3000) / 1000) * 99);
    } else {
      // Mythical 티어 (950-999): 4000점 이상
      const mythicalProgress = Math.min((rankingScore - 4000) / 2000, 1); // 6000점에서 최대
      level = Math.round(950 + mythicalProgress * 49);
    }

    // 1~999 범위로 제한
    return Math.max(1, Math.min(999, level));
  }

  // 레벨을 기반으로 티어 조회 (1-999 레벨 범위)
  findTierByLevel(level: number): LevelTier {
    const sortedTiers = [...TIER_SYSTEM].sort((a, b) => b.levelRange.min - a.levelRange.min);

    for (const tier of sortedTiers) {
      if (level >= tier.levelRange.min) {
        return tier;
      }
    }

    // 가장 낮은 티어 반환
    return sortedTiers[sortedTiers.length - 1];
  }

  // 레벨별 크레딧 계산
  calculateCreditsByLevel(level: number = 1): number {
    const tier = this.findTierByLevel(level);
    return tier.creditsPerMinute;
  }

  // 티어 정보 조회 (레벨 기반)
  getTierInfo(level: number = 1): LevelTier {
    return this.findTierByLevel(level);
  }

  // 레벨 기반 티어 정보 조회
  getTierInfoByLevel(level: number = 1): LevelTier {
    return this.findTierByLevel(level);
  }

  // 다음 티어 진행률 계산 (레벨 기반)
  getNextTierProgress(currentLevel: number = 1) {
    const currentTier = this.findTierByLevel(currentLevel);
    const sortedTiers = [...TIER_SYSTEM].sort((a, b) => b.levelRange.min - a.levelRange.min);
    const nextTier = sortedTiers.find(tier => tier.levelRange.min > currentLevel);

    if (!nextTier) {
      return {
        isMaxTier: true,
        progress: 100,
        currentTier,
        nextTier: null,
        levelsNeeded: 0,
        progressDescription: "최고 티어에 도달했습니다!"
      };
    }

    const levelRange = nextTier.levelRange.min - currentTier.levelRange.min;
    const currentProgress = currentLevel - currentTier.levelRange.min;
    const progress = levelRange > 0 ? Math.round((currentProgress / levelRange) * 100) : 0;

    return {
      isMaxTier: false,
      progress: Math.max(0, Math.min(100, progress)),
      currentTier,
      nextTier,
      levelsNeeded: nextTier.levelRange.min - currentLevel,
      progressDescription: `${nextTier.name}까지 Lv.${nextTier.levelRange.min - currentLevel} 필요`
    };
  }

  // 전문가 레벨 정보 조회 (DB 기반)
  async getExpertLevel(expertId: number): Promise<any> {
    try {
      // Expert 테이블과 관련 데이터 조회
      const expert = await this.prisma.expert.findUnique({
        where: { id: expertId },
        select: {
          id: true,
          totalSessions: true,
          ratingAvg: true,
          reviewCount: true,
          repeatClients: true,
          // 실제 관계형 데이터도 조회하여 검증
          reviews: {
            select: {
              rating: true,
              isPublic: true,
            }
          },
          reservations: {
            where: {
              status: 'CONFIRMED'
            },
            select: {
              userId: true,
            }
          }
        },
      });

      if (!expert) {
        return null;
      }

      // 실제 데이터로 통계 계산 (저장된 값과 검증)
      const actualTotalSessions = expert.reservations.length;
      const actualReviewCount = expert.reviews.length;
      const publicReviews = expert.reviews.filter(r => r.isPublic);
      const actualRatingAvg = publicReviews.length > 0
        ? publicReviews.reduce((sum, r) => sum + r.rating, 0) / publicReviews.length
        : 0;
      const userIds = expert.reservations.map(r => r.userId);
      const uniqueUsers = new Set(userIds);
      const actualRepeatClients = userIds.length - uniqueUsers.size;

      const stats: ExpertStats = {
        totalSessions: actualTotalSessions, // 실제 확정된 예약 수
        avgRating: actualRatingAvg, // 실제 계산된 평점
        reviewCount: actualReviewCount, // 실제 리뷰 수
        repeatClients: actualRepeatClients, // 실제 재방문 고객 수
        likeCount: 0, // 현재 시스템에 없는 필드
      };

      const rankingScore = this.calculateRankingScore(stats);
      const level = this.calculateLevelByScore(rankingScore);
      const tierInfo = this.getTierInfo(level);

      return {
        expertId: expertId.toString(),
        rankingScore,      // 무제한 랭킹 점수
        level,            // 1~999 범위의 레벨
        tierInfo,
        levelProgress: this.getNextTierProgress(level),
        pricing: {
          creditsPerMinute: tierInfo.creditsPerMinute,
          creditsPerHour: tierInfo.creditsPerMinute * 60,
          tierName: tierInfo.name,
        },
        metadata: {
          isUnlimitedScore: true,
          levelRange: "1-999",
          conversionNote: "랭킹점수(무제한) → 레벨(1-999) 변환",
          calculatedAt: new Date().toISOString(),
        }
      };
    } catch (error) {
      console.error('전문가 레벨 조회 실패:', error);
      return null;
    }
  }

  // 모든 레벨 정보 반환
  getAllLevels(): LevelTier[] {
    return TIER_SYSTEM;
  }

  // 레벨 요금 정보
  getLevelPricing(level: number) {
    const tier = this.getTierInfo(level);
    return {
      creditsPerMinute: tier.creditsPerMinute,
      creditsPerHour: tier.creditsPerMinute * 60,
      tierName: tier.name,
    };
  }

  // 티어별 통계 계산 (레벨 기반)
  calculateTierStatistics(experts: any[] = []) {
    const stats = TIER_SYSTEM.reduce(
      (acc, tier) => {
        acc[tier.name] = { count: 0, percentage: 0 };
        return acc;
      },
      {} as Record<string, { count: number; percentage: number }>
    );

    experts.forEach((expert) => {
      const level = expert.level || 1;
      const tier = this.findTierByLevel(level);
      stats[tier.name].count++;
    });

    const total = experts.length;
    if (total > 0) {
      Object.keys(stats).forEach((tierName) => {
        stats[tierName].percentage = Math.round(
          (stats[tierName].count / total) * 100
        );
      });
    }

    return stats;
  }
}