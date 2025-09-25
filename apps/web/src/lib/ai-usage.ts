import { api } from './api';

// AI 토큰 정책 상수 (서버와 동기화)
export const MONTHLY_FREE_TOKENS = 100000; // 매월 100,000 토큰 제공 (100%)
export const AVERAGE_TOKENS_PER_TURN = 900; // GPT-5 기준 1턴당 평균 900 토큰
export const AVERAGE_COST_PER_1K_TOKENS = 0.0071; // 1K 토큰당 평균 $0.0071
export const EXCHANGE_RATE_KRW = 1385; // 환율: 1달러 = 1,385원

// 크레딧 시스템 상수
export const CREDIT_TO_KRW = 10; // 1크레딧 = ₩10원
export const CREDIT_TO_TOKENS = 1000; // 1크레딧 = 1,000토큰
export const TOKENS_TO_KRW = 0.01; // 1,000토큰 = ₩10원 (크레딧 구매 시)

// AI 크레딧 정책
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

export interface AIUsageSummary {
  totalTokens: number;
  freeTokens: number;
  usedFreeTokens: number;
  usedPurchasedTokens: number;
  remainingFreeTokens: number;
  remainingPurchasedTokens: number;
  estimatedTurnsFromFree: number;
  estimatedTurnsFromPurchased: number;
  totalEstimatedTurns: number;
  nextResetDate: string;
  freeTokensUsagePercent: number;
  averageCostPerTurn: number;
  monthlyFreeValue: number;
  averageCostPerTurnKRW: number;
  monthlyFreeValueKRW: number;
  creditToTokens: number;
  creditToKRW: number;
  tokensToKRW: number;
  creditDiscount: number;
}

export interface AIUsageResponse {
  success: boolean;
  data: AIUsageState & {
    summary: AIUsageSummary;
  };
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

// 남은 크레딧 퍼센트 계산
export function calcRemainingCreditsPercent(
  usedCredits: number,
  purchasedCredits: number
): number {
  const total = MONTHLY_FREE_BUDGET_CREDITS + purchasedCredits;
  return Math.max(0, Math.round(100 * (1 - usedCredits / total)));
}

// API 호출 함수들
export async function getAIUsage(): Promise<AIUsageResponse> {
  const response = await api.get('/ai-usage');
  return response;
}

export async function addTurnUsage(totalTokens: number, preciseMode: boolean = false) {
  const response = await api.post('/ai-usage', {
    action: 'addTurnUsage',
    data: { totalTokens, preciseMode }
  });
  return response;
}

export async function addPurchasedTokens(tokens: number) {
  const response = await api.post('/ai-usage', {
    action: 'addPurchasedTokens',
    data: { tokens }
  });
  return response;
}

export async function addPurchasedCredits(credits: number) {
  const response = await api.post('/ai-usage', {
    action: 'addPurchasedCredits',
    data: { credits }
  });
  return response;
}

export async function grantTurns(turns: number) {
  const response = await api.post('/ai-usage', {
    action: 'grantTurns',
    data: { turns }
  });
  return response;
}

export async function resetMonthlyUsage() {
  const response = await api.post('/ai-usage', {
    action: 'resetMonthly'
  });
  return response;
}

export async function resetAllUsage() {
  const response = await api.post('/ai-usage', {
    action: 'resetAll'
  });
  return response;
}

export async function simulateUsage(
  simulationTurns: number,
  tokensPerTurn: number,
  preciseMode: boolean = false
) {
  const response = await api.post('/ai-usage', {
    action: 'simulateUsage',
    data: { simulationTurns, tokensPerTurn, preciseMode }
  });
  return response;
}

// 유틸리티 함수들
export function formatKRW(amount: number): string {
  return `₩${amount.toLocaleString()}`;
}

export function formatTokens(tokens: number): string {
  return `${tokens.toLocaleString()} 토큰`;
}

export function formatCredits(credits: number): string {
  return `${credits} 크레딧`;
}