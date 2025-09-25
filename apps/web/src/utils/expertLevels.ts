/**
 * 전문가 레벨 계산 및 관리 유틸리티 (통합된 무제한 점수 체계)
 */

import { calculateRankingScore, ExpertStats, ESTIMATION_RATIOS } from './rankingCalculator';

// 티어 정의 인터페이스
export interface LevelTier {
  id: number;
  name: string;
  nameKr: string;
  scoreThreshold: number;        // 해당 티어 진입에 필요한 최소 점수
  creditsPerMinute: number;
  color: string;
  bgGradient: string;
  textColor: string;
  borderColor: string;
  description: string;
}

// 레벨 기반 티어 시스템 (Lv.1~999 범위)
export const TIER_SYSTEM: LevelTier[] = [
  {
    id: 11,
    name: "Mythical",
    nameKr: "미시컬",
    scoreThreshold: 950,         // Lv.950-999 (50레벨 구간)
    creditsPerMinute: 800,
    color: "rainbow",
    bgGradient: "bg-gradient-to-r from-purple-600 via-pink-600 to-red-600",
    textColor: "text-white",
    borderColor: "border-purple-600",
    description: "전설을 넘어선 신화적 등급"
  },
  {
    id: 10,
    name: "Legend",
    nameKr: "레전드",
    scoreThreshold: 850,         // Lv.850-949 (100레벨 구간)
    creditsPerMinute: 600,
    color: "red",
    bgGradient: "bg-gradient-to-r from-red-600 to-pink-700",
    textColor: "text-white",
    borderColor: "border-red-600",
    description: "전설적인 등급"
  },
  {
    id: 9,
    name: "Champion",
    nameKr: "챔피언",
    scoreThreshold: 750,         // Lv.750-849 (100레벨 구간)
    creditsPerMinute: 500,
    color: "purple",
    bgGradient: "bg-gradient-to-r from-purple-600 to-indigo-700",
    textColor: "text-white",
    borderColor: "border-purple-600",
    description: "최고 수준의 챔피언"
  },
  {
    id: 8,
    name: "Grandmaster",
    nameKr: "그랜드마스터",
    scoreThreshold: 600,         // Lv.600-749 (150레벨 구간)
    creditsPerMinute: 450,
    color: "indigo",
    bgGradient: "bg-gradient-to-r from-indigo-600 to-blue-700",
    textColor: "text-white",
    borderColor: "border-indigo-600",
    description: "그랜드마스터 등급"
  },
  {
    id: 7,
    name: "Master",
    nameKr: "마스터",
    scoreThreshold: 450,         // Lv.450-599 (150레벨 구간)
    creditsPerMinute: 400,
    color: "blue",
    bgGradient: "bg-gradient-to-r from-blue-600 to-cyan-700",
    textColor: "text-white",
    borderColor: "border-blue-600",
    description: "마스터 등급"
  },
  {
    id: 6,
    name: "Diamond",
    nameKr: "다이아몬드",
    scoreThreshold: 300,         // Lv.300-449 (150레벨 구간)
    creditsPerMinute: 350,
    color: "cyan",
    bgGradient: "bg-gradient-to-r from-cyan-600 to-teal-700",
    textColor: "text-white",
    borderColor: "border-cyan-600",
    description: "다이아몬드 등급"
  },
  {
    id: 5,
    name: "Platinum",
    nameKr: "플래티넘",
    scoreThreshold: 200,         // Lv.200-299 (100레벨 구간)
    creditsPerMinute: 300,
    color: "teal",
    bgGradient: "bg-gradient-to-r from-teal-600 to-green-700",
    textColor: "text-white",
    borderColor: "border-teal-600",
    description: "플래티넘 등급"
  },
  {
    id: 4,
    name: "Gold",
    nameKr: "골드",
    scoreThreshold: 120,         // Lv.120-199 (80레벨 구간)
    creditsPerMinute: 250,
    color: "green",
    bgGradient: "bg-gradient-to-r from-green-600 to-emerald-700",
    textColor: "text-white",
    borderColor: "border-green-600",
    description: "골드 등급"
  },
  {
    id: 3,
    name: "Silver",
    nameKr: "실버",
    scoreThreshold: 70,          // Lv.70-119 (50레벨 구간)
    creditsPerMinute: 200,
    color: "emerald",
    bgGradient: "bg-gradient-to-r from-emerald-600 to-lime-700",
    textColor: "text-white",
    borderColor: "border-emerald-600",
    description: "실버 등급"
  },
  {
    id: 2,
    name: "Bronze",
    nameKr: "브론즈",
    scoreThreshold: 30,          // Lv.30-69 (40레벨 구간)
    creditsPerMinute: 150,
    color: "lime",
    bgGradient: "bg-gradient-to-r from-lime-600 to-yellow-700",
    textColor: "text-white",
    borderColor: "border-lime-600",
    description: "브론즈 등급"
  },
  {
    id: 1,
    name: "Iron",
    nameKr: "아이언",
    scoreThreshold: 1,           // Lv.1-29 (29레벨 구간)
    creditsPerMinute: 120,
    color: "yellow",
    bgGradient: "bg-gradient-to-r from-yellow-600 to-orange-700",
    textColor: "text-white",
    borderColor: "border-yellow-600",
    description: "아이언 등급"
  },
];

// 티어 시스템을 점수 기준으로 정렬 (내림차순)
const SORTED_TIERS = [...TIER_SYSTEM].sort((a, b) => b.scoreThreshold - a.scoreThreshold);

// 티어 조회 최적화를 위한 맵
const TIER_MAP = new Map(TIER_SYSTEM.map(tier => [tier.id, tier]));

/**
 * 이진 탐색을 통한 티어 조회 (O(log n) 성능)
 * @param score 랭킹 점수
 * @returns 해당하는 티어
 */
export const findTierByScore = (score: number): LevelTier => {
  // 이진 탐색으로 적절한 티어 찾기
  let left = 0;
  let right = SORTED_TIERS.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const tier = SORTED_TIERS[mid];

    if (score >= tier.scoreThreshold) {
      // 점수가 이 티어 이상이면 더 높은 티어가 있는지 확인
      if (mid === 0 || score < SORTED_TIERS[mid - 1].scoreThreshold) {
        return tier;
      }
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }

  // 가장 낮은 티어 반환
  return SORTED_TIERS[SORTED_TIERS.length - 1];
};

/**
 * ID로 티어 조회 (O(1) 성능)
 * @param tierId 티어 ID
 * @returns 티어 정보 또는 null
 */
export const getTierById = (tierId: number): LevelTier | null => {
  return TIER_MAP.get(tierId) || null;
};

/**
 * 랭킹 점수를 기반으로 레벨 계산 (1~999 범위로 제한)
 * @param rankingScore 랭킹 점수 (무제한)
 * @returns 계산된 레벨 (1~999)
 */
export const calculateLevelByScore = (rankingScore: number): number => {
  // 랭킹점수를 1~999 레벨로 변환
  // 점수가 높을수록 레벨이 높아지지만 최대 999로 제한

  if (rankingScore <= 0) return 1;

  // 점수를 레벨로 변환하는 공식 (조정 가능)
  // 점수 * 변환계수 = 레벨, 하지만 최대 999로 제한
  const conversionFactor = 5; // 20점당 약 100레벨 (조정 가능)
  const calculatedLevel = Math.round(rankingScore * conversionFactor);

  // 1~999 범위로 제한
  return Math.max(1, Math.min(999, calculatedLevel));
};

/**
 * 레벨에서 티어 계산
 * @param level 레벨 (점수 기반)
 * @returns 해당 티어
 */
export const getTierByLevel = (level: number): LevelTier => {
  return findTierByScore(level);
};

/**
 * 레벨별 크레딧 계산
 * @param level 레벨
 * @returns 분당 크레딧
 */
export const calculateCreditsByLevel = (level: number): number => {
  const tier = getTierByLevel(level);
  return tier.creditsPerMinute;
};

/**
 * 다음 티어까지의 진행률 계산 (레벨 기반)
 * @param currentLevel 현재 레벨 (1-999)
 * @returns 진행률 정보
 */
export const getNextTierProgress = (currentLevel: number) => {
  const currentTier = findTierByScore(currentLevel);
  const nextTier = SORTED_TIERS.find(tier => tier.scoreThreshold > currentLevel);

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

  const levelRange = nextTier.scoreThreshold - currentTier.scoreThreshold;
  const currentProgress = currentLevel - currentTier.scoreThreshold;
  const progress = levelRange > 0 ? Math.round((currentProgress / levelRange) * 100) : 0;

  return {
    isMaxTier: false,
    progress: Math.max(0, Math.min(100, progress)),
    currentTier,
    nextTier,
    levelsNeeded: nextTier.scoreThreshold - currentLevel,
    progressDescription: `${nextTier.nameKr}까지 Lv.${nextTier.scoreThreshold - currentLevel} 필요`
  };
};

/**
 * 전문가 통계를 기반으로 종합 레벨 정보 계산
 * @param stats 전문가 통계
 * @returns 종합 레벨 정보 (랭킹점수와 레벨 분리)
 */
export const calculateExpertLevelInfo = (stats: ExpertStats) => {
  const rankingScore = calculateRankingScore(stats); // 무제한 점수
  const level = calculateLevelByScore(rankingScore);  // 1~999 레벨
  const tier = getTierByLevel(level);
  const progress = getNextTierProgress(level);

  return {
    rankingScore,      // 무제한 증가 가능한 점수
    level,            // 1~999 범위의 레벨
    tier,
    progress,
    creditsPerMinute: tier.creditsPerMinute,
    metadata: {
      isUnlimitedScore: true,
      levelRange: "1-999",
      conversionNote: "랭킹점수(무제한) → 레벨(1-999) 변환",
      calculatedAt: new Date().toISOString(),
    }
  };
};

/**
 * 전문가 레벨 계산 (기존 호환성 유지)
 * @param totalSessions 총 상담 세션 수
 * @param avgRating 평균 평점
 * @param experienceYears 경력 년수 (현재 미사용, 향후 확장용)
 * @returns 계산된 레벨
 */
export const calculateExpertLevel = (
  totalSessions: number = 0,
  avgRating: number = 0,
  experienceYears: number = 0
): number => {
  const stats: ExpertStats = {
    totalSessions,
    avgRating,
    reviewCount: Math.floor(totalSessions * ESTIMATION_RATIOS.REVIEW_TO_SESSION),
    repeatClients: Math.floor(totalSessions * ESTIMATION_RATIOS.REPEAT_TO_SESSION),
    likeCount: Math.floor(totalSessions * ESTIMATION_RATIOS.LIKE_TO_SESSION),
  };

  const rankingScore = calculateRankingScore(stats);
  return calculateLevelByScore(rankingScore);
};

// ===== 하위 호환성 유지를 위한 레거시 함수들 =====

/**
 * @deprecated 새로운 getTierByLevel 사용 권장
 */
export const getTierByLevel_Legacy = (level: number) => {
  const legacyTiers = {
    1: { name: "Tier 1", minLevel: 1, maxLevel: 99, color: "blue" },
    2: { name: "Tier 2", minLevel: 100, maxLevel: 299, color: "green" },
    3: { name: "Tier 3", minLevel: 300, maxLevel: 499, color: "yellow" },
    4: { name: "Tier 4", minLevel: 500, maxLevel: 699, color: "orange" },
    5: { name: "Tier 5", minLevel: 700, maxLevel: 999, color: "red" },
  };

  if (level >= 1 && level <= 99) return legacyTiers[1];
  if (level >= 100 && level <= 299) return legacyTiers[2];
  if (level >= 300 && level <= 499) return legacyTiers[3];
  if (level >= 500 && level <= 699) return legacyTiers[4];
  if (level >= 700) return legacyTiers[5];

  return legacyTiers[1];
};

/**
 * @deprecated 새로운 calculateCreditsByLevel 사용 권장
 */
export const calculateCreditsByLevel_Legacy = (level: number): number => {
  const legacyRates = { 1: 100, 2: 150, 3: 200, 4: 300, 5: 500 };

  if (level >= 1 && level <= 99) return legacyRates[1];
  if (level >= 100 && level <= 299) return legacyRates[2];
  if (level >= 300 && level <= 499) return legacyRates[3];
  if (level >= 500 && level <= 699) return legacyRates[4];
  if (level >= 700) return legacyRates[5];

  return legacyRates[1];
};

// 레거시 상수들 (deprecated)
export const LEVEL_CREDIT_RATES = {
  1: 100, 2: 150, 3: 200, 4: 300, 5: 500,
} as const;

export const LEVEL_INFO = {
  1: { name: "Tier 1", minLevel: 1, maxLevel: 99, color: "blue" },
  2: { name: "Tier 2", minLevel: 100, maxLevel: 299, color: "green" },
  3: { name: "Tier 3", minLevel: 300, maxLevel: 499, color: "yellow" },
  4: { name: "Tier 4", minLevel: 500, maxLevel: 699, color: "orange" },
  5: { name: "Tier 5", minLevel: 700, maxLevel: 999, color: "red" },
} as const;