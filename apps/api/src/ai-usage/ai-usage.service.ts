import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreditsService } from '../credits/credits.service';
import {
  MONTHLY_FREE_TOKENS,
  AVERAGE_TOKENS_PER_TURN,
  CREDIT_TO_TOKENS,
  CREDIT_TO_KRW,
  AIUsageState,
  createAIUsageSummary,
  calcRemainingPercent,
  estimateCreditsForTurn,
} from '../config/ai-usage.config';

@Injectable()
export class AIUsageService {
  constructor(
    private prisma: PrismaService,
    private creditsService: CreditsService
  ) {}

  // AI 사용량 상태를 조회 (월간 리셋 체크 포함)
  async getUsageState(userId: number): Promise<AIUsageState> {
    // DB에서 사용자 AI 사용량 조회
    let aiUsage = await this.prisma.aIUsage.findUnique({
      where: { userId },
    });

    // 없으면 초기 상태 생성
    if (!aiUsage) {
      aiUsage = await this.prisma.aIUsage.create({
        data: {
          userId,
          usedTokens: 0,
          purchasedTokens: 0,
          totalTurns: 0,
          totalTokens: 0,
          monthlyResetDate: new Date(),
        },
      });
    }

    // 월간 리셋 체크
    const now = new Date();
    const lastReset = new Date(aiUsage.monthlyResetDate);

    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      // 월간 리셋 실행
      aiUsage = await this.prisma.aIUsage.update({
        where: { userId },
        data: {
          usedTokens: 0,
          totalTurns: 0,
          totalTokens: 0,
          monthlyResetDate: now,
        },
      });
    }

    const averageTokensPerTurn = aiUsage.totalTurns > 0 ? Math.round(aiUsage.totalTokens / aiUsage.totalTurns) : 0;
    const remainingPercent = calcRemainingPercent(aiUsage.usedTokens, aiUsage.purchasedTokens);

    return {
      usedTokens: aiUsage.usedTokens,
      purchasedTokens: aiUsage.purchasedTokens,
      remainingPercent,
      monthlyResetDate: aiUsage.monthlyResetDate.toISOString(),
      totalTurns: aiUsage.totalTurns,
      totalTokens: aiUsage.totalTokens,
      averageTokensPerTurn,
    };
  }

  // 턴 사용량 추가
  async addTurnUsage(userId: number, totalTokens: number, preciseMode: boolean = false) {
    // 정밀 모드일 경우 1.2배 토큰 소모
    const actualTokensUsed = preciseMode ? Math.round(totalTokens * 1.2) : totalTokens;

    // 크레딧 계산
    const creditsUsed = estimateCreditsForTurn(totalTokens, preciseMode);

    // AI 사용량 업데이트
    const updatedUsage = await this.prisma.aIUsage.upsert({
      where: { userId },
      update: {
        usedTokens: { increment: actualTokensUsed },
        totalTurns: { increment: 1 },
        totalTokens: { increment: actualTokensUsed },
      },
      create: {
        userId,
        usedTokens: actualTokensUsed,
        purchasedTokens: 0,
        totalTurns: 1,
        totalTokens: actualTokensUsed,
        monthlyResetDate: new Date(),
      },
    });

    // 크레딧 차감
    await this.creditsService.record(
      userId,
      -creditsUsed,
      `AI 상담 턴 사용 (${actualTokensUsed} 토큰, ${preciseMode ? '정밀 모드' : '일반 모드'})`,
      `ai-turn-${Date.now()}`
    );

    const averageTokensPerTurn = Math.round(updatedUsage.totalTokens / updatedUsage.totalTurns);
    const remainingPercent = calcRemainingPercent(updatedUsage.usedTokens, updatedUsage.purchasedTokens);

    return {
      spentTokens: actualTokensUsed,
      spentCredits: creditsUsed,
      newState: {
        usedTokens: updatedUsage.usedTokens,
        purchasedTokens: updatedUsage.purchasedTokens,
        remainingPercent,
        monthlyResetDate: updatedUsage.monthlyResetDate.toISOString(),
        totalTurns: updatedUsage.totalTurns,
        totalTokens: updatedUsage.totalTokens,
        averageTokensPerTurn,
      },
    };
  }

  // 구매한 토큰 추가
  async addPurchasedTokens(userId: number, tokens: number) {
    const updatedUsage = await this.prisma.aIUsage.upsert({
      where: { userId },
      update: {
        purchasedTokens: { increment: tokens },
      },
      create: {
        userId,
        usedTokens: 0,
        purchasedTokens: tokens,
        totalTurns: 0,
        totalTokens: 0,
        monthlyResetDate: new Date(),
      },
    });

    const averageTokensPerTurn = updatedUsage.totalTurns > 0 ? Math.round(updatedUsage.totalTokens / updatedUsage.totalTurns) : 0;
    const remainingPercent = calcRemainingPercent(updatedUsage.usedTokens, updatedUsage.purchasedTokens);

    return {
      usedTokens: updatedUsage.usedTokens,
      purchasedTokens: updatedUsage.purchasedTokens,
      remainingPercent,
      monthlyResetDate: updatedUsage.monthlyResetDate.toISOString(),
      totalTurns: updatedUsage.totalTurns,
      totalTokens: updatedUsage.totalTokens,
      averageTokensPerTurn,
    };
  }

  // 크레딧으로 토큰 구매
  async addPurchasedCredits(userId: number, credits: number) {
    const tokensFromCredits = credits * CREDIT_TO_TOKENS;
    const costInKRW = credits * CREDIT_TO_KRW;

    // 크레딧 차감
    await this.creditsService.record(
      userId,
      -credits,
      `토큰 구매 (${tokensFromCredits.toLocaleString()} 토큰)`,
      `token-purchase-${Date.now()}`
    );

    // 토큰 추가
    const newState = await this.addPurchasedTokens(userId, tokensFromCredits);

    const additionalTurns = Math.floor(tokensFromCredits / AVERAGE_TOKENS_PER_TURN);

    return {
      newState,
      purchasedCredits: credits,
      purchasedTokens: tokensFromCredits,
      costInKRW,
      additionalTurns,
    };
  }

  // 턴 수만큼 토큰 부여 (관리자용)
  async grantTurns(userId: number, turns: number) {
    const grantedTokens = turns * AVERAGE_TOKENS_PER_TURN;
    const newState = await this.addPurchasedTokens(userId, grantedTokens);

    return {
      grantedTokens,
      newState,
    };
  }

  // 월간 리셋 (무료 토큰 사용량만)
  async resetMonthly(userId: number) {
    const updatedUsage = await this.prisma.aIUsage.update({
      where: { userId },
      data: {
        usedTokens: 0,
        totalTurns: 0,
        totalTokens: 0,
        monthlyResetDate: new Date(),
      },
    });

    const remainingPercent = calcRemainingPercent(0, updatedUsage.purchasedTokens);

    return {
      usedTokens: 0,
      purchasedTokens: updatedUsage.purchasedTokens,
      remainingPercent,
      monthlyResetDate: updatedUsage.monthlyResetDate.toISOString(),
      totalTurns: 0,
      totalTokens: 0,
      averageTokensPerTurn: 0,
    };
  }

  // 모든 사용량 리셋 (관리자용)
  async resetAll(userId: number) {
    const updatedUsage = await this.prisma.aIUsage.update({
      where: { userId },
      data: {
        usedTokens: 0,
        purchasedTokens: 0,
        totalTurns: 0,
        totalTokens: 0,
        monthlyResetDate: new Date(),
      },
    });

    return {
      usedTokens: 0,
      purchasedTokens: 0,
      remainingPercent: 100,
      monthlyResetDate: updatedUsage.monthlyResetDate.toISOString(),
      totalTurns: 0,
      totalTokens: 0,
      averageTokensPerTurn: 0,
    };
  }

  // 사용량 시뮬레이션
  simulateUsage(currentState: AIUsageState, simulationTurns: number, tokensPerTurn: number, preciseMode: boolean = false) {
    let totalSimTokens = 0;

    for (let i = 0; i < simulationTurns; i++) {
      const tokensForTurn = preciseMode ? Math.round(tokensPerTurn * 1.2) : tokensPerTurn;
      totalSimTokens += tokensForTurn;
    }

    const remainingTokensForSim = Math.max(0, (MONTHLY_FREE_TOKENS + currentState.purchasedTokens) - currentState.usedTokens);
    const estimatedRemainingTurnsForSim = Math.floor(remainingTokensForSim / AVERAGE_TOKENS_PER_TURN);
    const canAffordTurns = Math.floor(remainingTokensForSim / (preciseMode ? tokensPerTurn * 1.2 : tokensPerTurn));

    return {
      turns: simulationTurns,
      tokensPerTurn,
      totalTokens: totalSimTokens,
      preciseMode,
      estimatedRemainingTurns: estimatedRemainingTurnsForSim,
      canAffordTurns,
      remainingTokens: remainingTokensForSim,
      costEstimate: (totalSimTokens / 1000) * 0.0071,
      costEstimateKRW: (totalSimTokens / 1000) * 0.0071 * 1385,
    };
  }
}