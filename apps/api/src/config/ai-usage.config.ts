// AI 토큰 정책 상수
export const MONTHLY_FREE_TOKENS = 100000; // 매월 100,000 토큰 제공 (100%)
export const AVERAGE_TOKENS_PER_TURN = 900; // GPT-5 기준 1턴당 평균 900 토큰
export const AVERAGE_COST_PER_1K_TOKENS = 0.0071; // 1K 토큰당 평균 $0.0071
export const EXCHANGE_RATE_KRW = 1385; // 환율: 1달러 = 1,385원

// 크레딧 시스템 상수
export const CREDIT_TO_KRW = 10; // 1크레딧 = ₩10원
export const CREDIT_TO_TOKENS = 1000; // 1크레딧 = 1,000토큰
export const TOKENS_TO_KRW = 0.01; // 1,000토큰 = ₩10원 (크레딧 구매 시)

// AI 크레딧 정책 (기존 constants/aiQuota.ts 에서 가져온 정책)
export const BASE_CREDIT_PER_TURN = 3;
export const MONTHLY_FREE_BUDGET_CREDITS = 300; // (= 100턴 × 3크레딧)

export interface LengthBracket {
  maxTokens: number;
  mult: number;
}

export const LENGTH_BRACKETS: LengthBracket[] = [
  { maxTokens: 400, mult: 1.0 },
  { maxTokens: 800, mult: 1.5 },
  { maxTokens: 1200, mult: 2.0 },
  { maxTokens: Infinity, mult: 3.0 },
];

export interface AIUsageState {
  usedTokens: number;
  purchasedTokens: number;
  remainingPercent: number;
  monthlyResetDate: string;
  totalTurns: number;
  totalTokens: number;
  averageTokensPerTurn: number;
}

// 토큰을 크레딧으로 계산
export function estimateCreditsForTurn(
  totalTokens: number,
  preciseMode?: boolean
): number {
  // 토큰 길이에 따른 브라켓 찾기
  const bracket = LENGTH_BRACKETS.find(
    (bracket) => totalTokens <= bracket.maxTokens
  );
  if (!bracket) {
    throw new Error("Invalid token count");
  }

  // 기본 크레딧에 멀티플라이어 적용
  let credits = BASE_CREDIT_PER_TURN * bracket.mult;

  // 정밀 모드일 경우 1.5배 추가
  if (preciseMode) {
    credits *= 1.5;
  }

  // 올림하여 반환
  return Math.ceil(credits);
}

// 남은 토큰 퍼센트 계산
export function calcRemainingPercent(
  usedTokens: number,
  purchasedTokens: number
): number {
  const total = MONTHLY_FREE_TOKENS + purchasedTokens;
  return Math.max(0, Math.round(100 * (1 - usedTokens / total)));
}

// 크레딧 기반 남은 퍼센트 계산
export function calcRemainingCreditsPercent(
  usedCredits: number,
  purchasedCredits: number
): number {
  const total = MONTHLY_FREE_BUDGET_CREDITS + purchasedCredits;
  return Math.max(0, Math.round(100 * (1 - usedCredits / total)));
}

// summary 객체 생성 helper 함수
export function createAIUsageSummary(aiUsageState: AIUsageState) {
  const totalFreeTokens = MONTHLY_FREE_TOKENS;

  // 구매 토큰이 있으면 구매 토큰을 우선 사용하도록 로직 수정
  let usedFreeTokens, usedPurchasedTokens, remainingFreeTokens, remainingPurchasedTokens;

  if (aiUsageState.purchasedTokens > 0) {
    // 구매 토큰이 있는 경우: 구매 토큰을 먼저 사용
    usedPurchasedTokens = Math.min(aiUsageState.usedTokens, aiUsageState.purchasedTokens);
    usedFreeTokens = Math.max(0, aiUsageState.usedTokens - aiUsageState.purchasedTokens);
    remainingPurchasedTokens = Math.max(0, aiUsageState.purchasedTokens - usedPurchasedTokens);
    remainingFreeTokens = Math.max(0, totalFreeTokens - usedFreeTokens);
  } else {
    // 구매 토큰이 없는 경우: 기존 로직
    usedFreeTokens = Math.min(aiUsageState.usedTokens, totalFreeTokens);
    usedPurchasedTokens = Math.max(0, aiUsageState.usedTokens - totalFreeTokens);
    remainingFreeTokens = Math.max(0, totalFreeTokens - aiUsageState.usedTokens);
    remainingPurchasedTokens = 0;
  }

  // 예상 턴 수 계산
  const estimatedTurnsFromFree = Math.floor(remainingFreeTokens / AVERAGE_TOKENS_PER_TURN);
  const estimatedTurnsFromPurchased = Math.floor(remainingPurchasedTokens / AVERAGE_TOKENS_PER_TURN);

  return {
    totalTokens: totalFreeTokens + aiUsageState.purchasedTokens,
    freeTokens: totalFreeTokens,
    usedFreeTokens,
    usedPurchasedTokens,
    remainingFreeTokens,
    remainingPurchasedTokens,
    estimatedTurnsFromFree,
    estimatedTurnsFromPurchased,
    totalEstimatedTurns: estimatedTurnsFromFree + estimatedTurnsFromPurchased,
    nextResetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
    // 무료 제공량 사용률 (무료 토큰만의 사용률)
    freeTokensUsagePercent: Math.round((usedFreeTokens / totalFreeTokens) * 100),
    // 비용 정보
    averageCostPerTurn: (AVERAGE_TOKENS_PER_TURN / 1000) * AVERAGE_COST_PER_1K_TOKENS,
    monthlyFreeValue: (MONTHLY_FREE_TOKENS / 1000) * AVERAGE_COST_PER_1K_TOKENS,
    // 원화 비용 정보
    averageCostPerTurnKRW: (AVERAGE_TOKENS_PER_TURN / 1000) * AVERAGE_COST_PER_1K_TOKENS * EXCHANGE_RATE_KRW,
    monthlyFreeValueKRW: (MONTHLY_FREE_TOKENS / 1000) * AVERAGE_COST_PER_1K_TOKENS * EXCHANGE_RATE_KRW,
    // 크레딧 시스템 정보
    creditToTokens: CREDIT_TO_TOKENS,
    creditToKRW: CREDIT_TO_KRW,
    tokensToKRW: TOKENS_TO_KRW,
    creditDiscount: Math.round((1 - (TOKENS_TO_KRW / (AVERAGE_COST_PER_1K_TOKENS * EXCHANGE_RATE_KRW))) * 100)
  };
}