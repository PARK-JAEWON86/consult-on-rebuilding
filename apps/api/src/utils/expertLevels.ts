/**
 * 전문가 레벨 계산 및 관리 유틸리티 (백엔드용)
 */

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
 * 전문가 레벨 계산 (기존 호환성 유지)
 * @param totalSessions 총 상담 세션 수
 * @param avgRating 평균 평점
 * @param experienceYears 경력 년수
 * @returns 계산된 레벨
 */
export const calculateExpertLevel = (
  totalSessions: number = 0,
  avgRating: number = 0,
  experienceYears: number = 0
): number => {
  // 기본 점수 계산 로직
  let score = 0;

  // 세션 수에 따른 점수 (최대 400점)
  score += Math.min(400, totalSessions * 2);

  // 평점에 따른 점수 (최대 200점)
  if (avgRating > 0) {
    score += Math.max(0, (avgRating - 3) * 100); // 3점 이상부터 점수
  }

  // 경력에 따른 점수 (최대 100점)
  score += Math.min(100, experienceYears * 10);

  // 1~999 레벨 범위로 제한
  return Math.max(1, Math.min(999, Math.floor(score)));
};