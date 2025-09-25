/**
 * 공식 랭킹 점수 계산 유틸리티 (무제한 점수 체계)
 */

export interface ExpertStats {
  totalSessions?: number;
  avgRating?: number;
  reviewCount?: number;
  repeatClients?: number;
  likeCount?: number;
}

// 점수 계산 상수들
export const SCORE_WEIGHTS = {
  SESSIONS: 0.25,      // 25% - 경험 중시하되 비율 낮춤
  RATING: 0.35,        // 35% - 서비스 품질 가장 중요
  REVIEWS: 0.15,       // 15% - 신뢰도 지표
  REPEAT_RATE: 0.20,   // 20% - 만족도 핵심 지표
  LIKES: 0.05,         // 5% - 보조 지표
} as const;

// 기준점 상수들 (더 엄격하게 조정)
export const SCORE_BASELINES = {
  SESSIONS_PER_POINT: 8,    // 8회당 1점 (기존 200회 → 25점에서 더 엄격하게)
  MAX_RATING: 5,            // 5점 만점
  REVIEWS_PER_POINT: 4,     // 4개당 1점 (기존 100개 → 15점에서 더 엄격하게)
  LIKES_PER_POINT: 10,      // 10개당 1점 (기존 200개 → 5점에서 더 엄격하게)
} as const;

// 추정값 비율 상수
export const ESTIMATION_RATIOS = {
  REVIEW_TO_SESSION: 0.3,   // 세션 대비 리뷰 비율
  REPEAT_TO_SESSION: 0.2,   // 세션 대비 재방문 비율
  LIKE_TO_SESSION: 0.4,     // 세션 대비 좋아요 비율
} as const;

/**
 * 입력 통계 검증
 */
export const validateStats = (stats: ExpertStats): boolean => {
  const totalSessions = stats.totalSessions || 0;
  const avgRating = stats.avgRating || 0;
  const repeatClients = stats.repeatClients || 0;

  return (
    totalSessions >= 0 &&
    avgRating >= 0 && avgRating <= 5 &&
    repeatClients >= 0 && repeatClients <= totalSessions
  );
};

/**
 * 개선된 랭킹 점수 계산 함수 (무제한 점수 체계)
 * @param stats 전문가 통계 데이터
 * @returns 계산된 랭킹 점수 (무제한)
 */
export const calculateRankingScore = (stats: ExpertStats): number => {
  if (!validateStats(stats)) {
    console.warn('Invalid stats provided to calculateRankingScore:', stats);
    return 0;
  }

  const totalSessions = stats.totalSessions || 0;
  const avgRating = stats.avgRating || 0;
  const reviewCount = stats.reviewCount || 0;
  const repeatClients = stats.repeatClients || 0;
  const likeCount = stats.likeCount || 0;

  // 1. 상담 횟수 점수 (무제한 증가, 하지만 더 엄격하게)
  const sessionScore = (totalSessions / SCORE_BASELINES.SESSIONS_PER_POINT) * SCORE_WEIGHTS.SESSIONS * 100;

  // 2. 평점 점수 (5점 만점 기준)
  const ratingScore = (avgRating / SCORE_BASELINES.MAX_RATING) * SCORE_WEIGHTS.RATING * 100;

  // 3. 리뷰 수 점수 (무제한 증가, 하지만 더 엄격하게)
  const reviewScore = (reviewCount / SCORE_BASELINES.REVIEWS_PER_POINT) * SCORE_WEIGHTS.REVIEWS * 100;

  // 4. 재방문 고객 비율 점수
  const repeatRate = totalSessions > 0 ? repeatClients / totalSessions : 0;
  const repeatScore = repeatRate * SCORE_WEIGHTS.REPEAT_RATE * 100;

  // 5. 좋아요 수 점수 (무제한 증가, 하지만 더 엄격하게)
  const likeScore = (likeCount / SCORE_BASELINES.LIKES_PER_POINT) * SCORE_WEIGHTS.LIKES * 100;

  const totalScore = sessionScore + ratingScore + reviewScore + repeatScore + likeScore;
  return Math.round(totalScore * 100) / 100;
};

/**
 * 랭킹 점수 상세 분석 (디버깅용)
 * @param stats 전문가 통계 데이터
 * @returns 점수 분석 결과
 */
export const getRankingScoreBreakdown = (stats: ExpertStats) => {
  const totalSessions = stats.totalSessions || 0;
  const avgRating = stats.avgRating || 0;
  const reviewCount = stats.reviewCount || 0;
  const repeatClients = stats.repeatClients || 0;
  const likeCount = stats.likeCount || 0;

  // 개별 점수 계산 (새로운 로직 사용)
  const sessionScore = (totalSessions / SCORE_BASELINES.SESSIONS_PER_POINT) * SCORE_WEIGHTS.SESSIONS * 100;
  const ratingScore = (avgRating / SCORE_BASELINES.MAX_RATING) * SCORE_WEIGHTS.RATING * 100;
  const reviewScore = (reviewCount / SCORE_BASELINES.REVIEWS_PER_POINT) * SCORE_WEIGHTS.REVIEWS * 100;
  const repeatRate = totalSessions > 0 ? repeatClients / totalSessions : 0;
  const repeatScore = repeatRate * SCORE_WEIGHTS.REPEAT_RATE * 100;
  const likeScore = (likeCount / SCORE_BASELINES.LIKES_PER_POINT) * SCORE_WEIGHTS.LIKES * 100;

  const totalScore = sessionScore + ratingScore + reviewScore + repeatScore + likeScore;

  return {
    sessionScore: Math.round(sessionScore * 100) / 100,
    ratingScore: Math.round(ratingScore * 100) / 100,
    reviewScore: Math.round(reviewScore * 100) / 100,
    repeatScore: Math.round(repeatScore * 100) / 100,
    likeScore: Math.round(likeScore * 100) / 100,
    totalScore: Math.round(totalScore * 100) / 100,
    breakdown: {
      sessions: `${totalSessions}회 → ${Math.round(sessionScore * 100) / 100}점 (${SCORE_WEIGHTS.SESSIONS * 100}%)`,
      rating: `${avgRating}점 → ${Math.round(ratingScore * 100) / 100}점 (${SCORE_WEIGHTS.RATING * 100}%)`,
      reviews: `${reviewCount}개 → ${Math.round(reviewScore * 100) / 100}점 (${SCORE_WEIGHTS.REVIEWS * 100}%)`,
      repeat: `${Math.round(repeatRate * 100)}% → ${Math.round(repeatScore * 100) / 100}점 (${SCORE_WEIGHTS.REPEAT_RATE * 100}%)`,
      likes: `${likeCount}개 → ${Math.round(likeScore * 100) / 100}점 (${SCORE_WEIGHTS.LIKES * 100}%)`
    },
    // 추가 정보
    metadata: {
      baselines: SCORE_BASELINES,
      weights: SCORE_WEIGHTS,
      isUnlimited: true
    }
  };
};