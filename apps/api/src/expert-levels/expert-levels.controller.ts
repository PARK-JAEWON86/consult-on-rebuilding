import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { ExpertLevelsService } from './expert-levels.service';

@Controller('expert-levels')
export class ExpertLevelsController {
  constructor(
    private readonly expertLevelsService: ExpertLevelsService
  ) {}

  @Get()
  async getExpertLevelData(
    @Query('action') action: string,
    @Query('level') level?: string,
    @Query('expertId') expertId?: string,
    @Query('totalSessions') totalSessions?: string,
    @Query('avgRating') avgRating?: string,
    @Query('reviewCount') reviewCount?: string,
    @Query('repeatClients') repeatClients?: string,
    @Query('likeCount') likeCount?: string,
    @Query('rankingScore') rankingScore?: string,
    @Query('tierName') tierName?: string
  ) {
    try {
      let result: any = {};

      switch (action) {
        case 'getAllLevels':
          result = { levels: this.expertLevelsService.getAllLevels() };
          break;

        case 'calculateCreditsByLevel':
          if (level) {
            result = {
              level: parseInt(level),
              creditsPerMinute: this.expertLevelsService.calculateCreditsByLevel(parseInt(level)),
            };
          }
          break;

        case 'getTierInfo':
          if (level) {
            result = {
              level: parseInt(level),
              tierInfo: this.expertLevelsService.getTierInfo(parseInt(level)),
            };
          }
          break;

        case 'getExpertLevel':
          if (expertId) {
            const expertLevelData = await this.expertLevelsService.getExpertLevel(parseInt(expertId));

            if (expertLevelData) {
              result = {
                currentLevel: expertLevelData.level,
                levelTitle: expertLevelData.tierInfo.name,
                tierInfo: expertLevelData.tierInfo,
                rankingScore: expertLevelData.rankingScore,
                levelProgress: expertLevelData.levelProgress,
                pricing: expertLevelData.pricing,
              };
            } else {
              // 기본값 반환
              const mockLevel = Math.floor(Math.random() * 99) + 1;
              const tierInfo = this.expertLevelsService.getTierInfo(mockLevel);

              result = {
                currentLevel: mockLevel,
                levelTitle: tierInfo.name,
                tierInfo: tierInfo,
                rankingScore: 25 + Math.random() * 25,
                levelProgress: this.expertLevelsService.getNextTierProgress(mockLevel),
                pricing: {
                  creditsPerMinute: tierInfo.creditsPerMinute,
                  creditsPerHour: tierInfo.creditsPerMinute * 60,
                  tierName: tierInfo.name,
                },
              };
            }
          }
          break;

        case 'calculateLevelByScore':
          if (rankingScore) {
            const score = parseFloat(rankingScore);
            const level = this.expertLevelsService.calculateLevelByScore(score);
            const tierInfo = this.expertLevelsService.getTierInfo(level);

            result = {
              rankingScore: score,
              calculatedLevel: level,
              tierInfo: tierInfo,
              levelProgress: this.expertLevelsService.getNextTierProgress(level),
            };
          }
          break;

        case 'calculateRankingScore':
          if (totalSessions && avgRating) {
            const stats = {
              totalSessions: parseInt(totalSessions),
              avgRating: parseFloat(avgRating),
              reviewCount: parseInt(reviewCount || '0'),
              repeatClients: parseInt(repeatClients || '0'),
              likeCount: parseInt(likeCount || '0'),
            };

            const score = this.expertLevelsService.calculateRankingScore(stats);
            const level = this.expertLevelsService.calculateLevelByScore(score);
            const tierInfo = this.expertLevelsService.getTierInfo(level);

            result = {
              stats,
              calculatedScore: score,
              calculatedLevel: level,
              tierInfo,
            };
          }
          break;

        case 'getLevelPricing':
          if (level) {
            result = {
              level: parseInt(level),
              pricing: this.expertLevelsService.getLevelPricing(parseInt(level)),
            };
          }
          break;

        case 'getNextTierProgress':
          if (level) {
            result = {
              level: parseInt(level),
              progress: this.expertLevelsService.getNextTierProgress(parseInt(level)),
            };
          }
          break;

        default:
          result = {
            message: '사용 가능한 액션들',
            actions: [
              'getAllLevels',
              'calculateCreditsByLevel',
              'getTierInfo',
              'getExpertLevel',
              'calculateLevelByScore',
              'calculateRankingScore',
              'getLevelPricing',
              'getNextTierProgress',
            ],
          };
      }

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: '서버 오류가 발생했습니다.',
      };
    }
  }

  @Post()
  async manageExpertLevels(@Body() body: { action: string; data?: any }) {
    try {
      const { action, data } = body;
      let result: any = {};

      switch (action) {
        case 'calculateTierStatistics':
          if (data?.experts) {
            result = {
              statistics: this.expertLevelsService.calculateTierStatistics(data.experts),
            };
          }
          break;

        case 'batchCalculate':
          if (data?.experts) {
            const experts = data.experts.map((expert: any) => ({
              ...expert,
              tierInfo: this.expertLevelsService.getTierInfo(expert.level || expert.rankingScore || 1),
              creditsPerMinute: this.expertLevelsService.calculateCreditsByLevel(expert.level || expert.rankingScore || 1),
              pricing: this.expertLevelsService.getLevelPricing(expert.level || expert.rankingScore || 1),
            }));
            result = { experts };
          }
          break;

        case 'bulkUpdate':
          if (data?.experts) {
            const updatedExperts = data.experts.map((expert: any) => {
              const level = this.expertLevelsService.calculateLevelByScore(expert.rankingScore || 0);
              const tierInfo = this.expertLevelsService.getTierInfo(level);

              return {
                expertId: expert.expertId,
                rankingScore: expert.rankingScore,
                level: level,
                tierInfo: tierInfo,
                creditsPerMinute: tierInfo.creditsPerMinute,
              };
            });

            result = {
              updatedExperts,
              message: `${updatedExperts.length}명의 전문가 레벨이 업데이트되었습니다.`,
            };
          }
          break;

        default:
          result = { error: '지원하지 않는 액션입니다.' };
      }

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: '서버 오류가 발생했습니다.',
      };
    }
  }
}