import { Controller, Get, Post, Patch, Delete, Body, Query } from '@nestjs/common';
import { AIUsageService } from './ai-usage.service';
import { createAIUsageSummary } from '../config/ai-usage.config';

@Controller('ai-usage')
export class AIUsageController {
  constructor(private readonly aiUsageService: AIUsageService) {}

  @Get()
  async getUsage(@Query('userId') userId?: string) {
    const uid = Number(userId || 1); // TODO: Auth 연동 시 토큰에서 추출

    const usageState = await this.aiUsageService.getUsageState(uid);
    const summary = createAIUsageSummary(usageState);

    return {
      success: true,
      data: {
        ...usageState,
        summary,
      },
    };
  }

  @Post()
  async manageUsage(
    @Body() body: { action: string; data?: any },
    @Query('userId') userId?: string
  ) {
    const uid = Number(userId || 1); // TODO: Auth 연동 시 토큰에서 추출
    const { action, data } = body;

    switch (action) {
      case 'addTurnUsage': {
        const { totalTokens, preciseMode = false } = data;

        if (!totalTokens || totalTokens <= 0) {
          return {
            success: false,
            error: '유효하지 않은 토큰 수',
          };
        }

        const result = await this.aiUsageService.addTurnUsage(uid, totalTokens, preciseMode);
        const summary = createAIUsageSummary(result.newState);

        // 예상 남은 턴 수 계산
        const remainingTokensAfterUsage = Math.max(0, (100000 + result.newState.purchasedTokens) - result.newState.usedTokens);
        const estimatedRemainingTurns = Math.floor(remainingTokensAfterUsage / 900);

        return {
          success: true,
          data: {
            ...result,
            newState: {
              ...result.newState,
              summary,
            },
            estimatedRemainingTurns,
            message: `턴 사용량이 추가되었습니다. 소모된 토큰: ${result.spentTokens} (${preciseMode ? '정밀 모드' : '일반 모드'})`,
          },
        };
      }

      case 'addPurchasedTokens': {
        const { tokens } = data;

        if (!tokens || tokens <= 0) {
          return {
            success: false,
            error: '유효하지 않은 토큰 수',
          };
        }

        const newState = await this.aiUsageService.addPurchasedTokens(uid, tokens);
        const summary = createAIUsageSummary(newState);

        const additionalTurns = Math.floor(tokens / 900);

        return {
          success: true,
          data: {
            newState: {
              ...newState,
              summary,
            },
            additionalTurns,
            message: `${tokens.toLocaleString()} 토큰이 구매되었습니다. (예상 ${additionalTurns}턴)`,
          },
        };
      }

      case 'addPurchasedCredits': {
        const { credits } = data;

        if (!credits || credits <= 0) {
          return {
            success: false,
            error: '유효하지 않은 크레딧 수',
          };
        }

        const result = await this.aiUsageService.addPurchasedCredits(uid, credits);
        const summary = createAIUsageSummary(result.newState);

        return {
          success: true,
          data: {
            ...result,
            newState: {
              ...result.newState,
              summary,
            },
            message: `${credits}크레딧(₩${result.costInKRW.toLocaleString()})으로 ${result.purchasedTokens.toLocaleString()} 토큰이 구매되었습니다. (예상 ${result.additionalTurns}턴)`,
          },
        };
      }

      case 'grantTurns': {
        const { turns } = data;

        if (!turns || turns <= 0) {
          return {
            success: false,
            error: '유효하지 않은 턴 수',
          };
        }

        const result = await this.aiUsageService.grantTurns(uid, turns);
        const summary = createAIUsageSummary(result.newState);

        return {
          success: true,
          data: {
            ...result,
            newState: {
              ...result.newState,
              summary,
            },
            message: `${turns}턴이 부여되었습니다. (${result.grantedTokens.toLocaleString()} 토큰)`,
          },
        };
      }

      case 'resetMonthly': {
        const newState = await this.aiUsageService.resetMonthly(uid);
        const summary = createAIUsageSummary(newState);

        return {
          success: true,
          data: {
            newState: {
              ...newState,
              summary,
            },
            message: '월간 사용량이 리셋되었습니다.',
          },
        };
      }

      case 'resetAll': {
        const newState = await this.aiUsageService.resetAll(uid);
        const summary = createAIUsageSummary(newState);

        return {
          success: true,
          data: {
            newState: {
              ...newState,
              summary,
            },
            message: '모든 AI 사용량이 리셋되었습니다.',
          },
        };
      }

      case 'simulateUsage': {
        const { simulationTurns, tokensPerTurn, preciseMode = false } = data;

        if (!simulationTurns || !tokensPerTurn) {
          return {
            success: false,
            error: '시뮬레이션 파라미터가 필요합니다',
          };
        }

        const currentState = await this.aiUsageService.getUsageState(uid);
        const simulationResult = this.aiUsageService.simulateUsage(
          currentState,
          simulationTurns,
          tokensPerTurn,
          preciseMode
        );

        return {
          success: true,
          data: {
            simulation: simulationResult,
            message: '사용량 시뮬레이션이 완료되었습니다.',
          },
        };
      }

      default:
        return {
          success: false,
          error: '알 수 없는 액션',
        };
    }
  }

  @Patch()
  async updateUsage(
    @Body() body: { updates: any },
    @Query('userId') userId?: string
  ) {
    const uid = Number(userId || 1); // TODO: Auth 연동 시 토큰에서 추출
    const { updates } = body;

    // 현재 상태를 가져온 후 업데이트
    const currentState = await this.aiUsageService.getUsageState(uid);

    // TODO: Implement partial update logic
    // For now, return current state with summary
    const summary = createAIUsageSummary(currentState);

    return {
      success: true,
      data: {
        newState: currentState,
        summary,
        message: 'AI 사용량이 업데이트되었습니다.',
      },
    };
  }

  @Delete()
  async deleteUsage(@Query('userId') userId?: string) {
    const uid = Number(userId || 1); // TODO: Auth 연동 시 토큰에서 추출

    const newState = await this.aiUsageService.resetAll(uid);

    return {
      success: true,
      data: {
        message: '모든 AI 사용량이 초기화되었습니다.',
      },
    };
  }
}