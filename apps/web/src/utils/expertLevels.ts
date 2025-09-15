/**
 * 전문가 레벨 계산 및 관리 유틸리티
 */

// 레벨별 크레딧 요금 (분당)
export const LEVEL_CREDIT_RATES = {
  1: 100,   // Lv.1-99: 100 크레딧/분
  2: 150,   // Lv.100-299: 150 크레딧/분
  3: 200,   // Lv.300-499: 200 크레딧/분
  4: 300,   // Lv.500-699: 300 크레딧/분
  5: 500,   // Lv.700+: 500 크레딧/분
} as const;

// 레벨별 정보
export const LEVEL_INFO = {
  1: { name: "Tier 1", minLevel: 1, maxLevel: 99, color: "blue" },
  2: { name: "Tier 2", minLevel: 100, maxLevel: 299, color: "green" },
  3: { name: "Tier 3", minLevel: 300, maxLevel: 499, color: "yellow" },
  4: { name: "Tier 4", minLevel: 500, maxLevel: 699, color: "orange" },
  5: { name: "Tier 5", minLevel: 700, maxLevel: 999, color: "red" },
} as const;

/**
 * 전문가 레벨을 기반으로 크레딧 요금 계산
 * @param level 전문가 레벨 (1-999)
 * @returns 분당 크레딧 요금
 */
export function calculateCreditsByLevel(level: number): number {
  if (level >= 1 && level <= 99) return LEVEL_CREDIT_RATES[1];
  if (level >= 100 && level <= 299) return LEVEL_CREDIT_RATES[2];
  if (level >= 300 && level <= 499) return LEVEL_CREDIT_RATES[3];
  if (level >= 500 && level <= 699) return LEVEL_CREDIT_RATES[4];
  if (level >= 700) return LEVEL_CREDIT_RATES[5];
  
  return LEVEL_CREDIT_RATES[1]; // 기본값
}

/**
 * 전문가 레벨을 기반으로 티어 정보 반환
 * @param level 전문가 레벨
 * @returns 티어 정보
 */
export function getTierByLevel(level: number) {
  if (level >= 1 && level <= 99) return LEVEL_INFO[1];
  if (level >= 100 && level <= 299) return LEVEL_INFO[2];
  if (level >= 300 && level <= 499) return LEVEL_INFO[3];
  if (level >= 500 && level <= 699) return LEVEL_INFO[4];
  if (level >= 700) return LEVEL_INFO[5];
  
  return LEVEL_INFO[1]; // 기본값
}

/**
 * 전문가 레벨 계산 (세션 수, 평점, 경력 기반)
 * @param totalSessions 총 상담 세션 수
 * @param avgRating 평균 평점
 * @param experienceYears 경력 년수
 * @returns 계산된 레벨
 */
export function calculateExpertLevel(
  totalSessions: number = 0,
  avgRating: number = 0,
  experienceYears: number = 0
): number {
  // 기본 레벨 1
  let level = 1;
  
  // 세션 수 기반 레벨 증가
  if (totalSessions >= 500) level += 4;
  else if (totalSessions >= 200) level += 3;
  else if (totalSessions >= 100) level += 2;
  else if (totalSessions >= 50) level += 1;
  
  // 평점 기반 레벨 증가
  if (avgRating >= 4.8) level += 2;
  else if (avgRating >= 4.5) level += 1;
  
  // 경력 기반 레벨 증가
  if (experienceYears >= 10) level += 2;
  else if (experienceYears >= 5) level += 1;
  
  return Math.min(level, 999); // 최대 레벨 999
}
