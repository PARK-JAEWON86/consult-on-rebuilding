import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExpertLevelsService } from '../expert-levels/expert-levels.service';

@Injectable()
export class ExpertStatsService {
  constructor(
    private prisma: PrismaService,
    private expertLevelsService: ExpertLevelsService
  ) {}

  // 전문가 통계 조회
  async getExpertStats(expertId?: number) {
    try {
      const where = expertId ? { id: expertId } : {};

      const experts = await this.prisma.expert.findMany({
        where: {
          ...where,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          specialty: true,
          totalSessions: true,
          ratingAvg: true,
          reviewCount: true,
          repeatClients: true,
          experience: true,
          categoryLinks: {
            include: {
              category: {
                select: {
                  nameKo: true,
                  slug: true,
                },
              },
            },
          },
        },
      });

      if (expertId && experts.length === 0) {
        return { success: false, message: '전문가를 찾을 수 없습니다.' };
      }

      // 단일 전문가 조회인 경우
      if (expertId) {
        const expert = experts[0];
        const stats = {
          totalSessions: expert.totalSessions,
          avgRating: expert.ratingAvg,
          reviewCount: expert.reviewCount,
          repeatClients: expert.repeatClients,
          likeCount: 0, // 임시값 (추후 필요시 추가)
        };

        const rankingScore = this.expertLevelsService.calculateRankingScore(stats);
        const level = this.expertLevelsService.calculateLevelByScore(rankingScore);

        // 카테고리 정보 가져오기
        const primaryCategory = expert.categoryLinks?.[0]?.category;
        const specialty = expert.specialty || primaryCategory?.nameKo || 'General';

        return {
          success: true,
          data: {
            expertId: expert.id.toString(),
            expertName: expert.name,
            specialty,
            totalSessions: expert.totalSessions,
            avgRating: expert.ratingAvg,
            reviewCount: expert.reviewCount,
            repeatClients: expert.repeatClients,
            likeCount: 0,
            rankingScore,
            level,
          },
        };
      }

      // 전체 전문가 목록인 경우
      return {
        success: true,
        data: {
          experts: experts.map((expert) => {
            const stats = {
              totalSessions: expert.totalSessions,
              avgRating: expert.ratingAvg,
              reviewCount: expert.reviewCount,
              repeatClients: expert.repeatClients,
              likeCount: 0,
            };

            const rankingScore = this.expertLevelsService.calculateRankingScore(stats);
            const level = this.expertLevelsService.calculateLevelByScore(rankingScore);

            // 카테고리 정보 가져오기
            const primaryCategory = expert.categoryLinks?.[0]?.category;
            const specialty = expert.specialty || primaryCategory?.nameKo || 'General';

            return {
              expertId: expert.id.toString(),
              expertName: expert.name,
              specialty,
              totalSessions: expert.totalSessions,
              avgRating: expert.ratingAvg,
              reviewCount: expert.reviewCount,
              repeatClients: expert.repeatClients,
              likeCount: 0,
              rankingScore,
              level,
            };
          }),
        },
      };
    } catch (error) {
      console.error('전문가 통계 조회 실패:', error);
      return { success: false, error: '통계 조회에 실패했습니다.' };
    }
  }

  // 랭킹 목록 조회
  async getRankings(rankingType: string = 'overall', specialty?: string) {
    try {
      const where: any = { isActive: true };

      // 분야별 필터링
      if (specialty && rankingType === 'specialty') {
        console.log(`[DEBUG] 분야별 필터링 적용: ${specialty}`);
        where.OR = [
          { specialty: { contains: specialty } },
          {
            categoryLinks: {
              some: {
                category: {
                  nameKo: { contains: specialty }
                }
              }
            }
          }
        ];
      }

      const experts = await this.prisma.expert.findMany({
        where,
        select: {
          id: true,
          name: true,
          specialty: true,
          totalSessions: true,
          ratingAvg: true,
          reviewCount: true,
          repeatClients: true,
          experience: true,
          categoryLinks: {
            include: {
              category: {
                select: {
                  nameKo: true,
                  slug: true,
                },
              },
            },
          },
        },
      });

      // 각 전문가의 랭킹 점수 계산
      const rankings = experts.map((expert, index) => {
        const stats = {
          totalSessions: expert.totalSessions,
          avgRating: expert.ratingAvg,
          reviewCount: expert.reviewCount,
          repeatClients: expert.repeatClients,
          likeCount: 0,
        };

        const rankingScore = this.expertLevelsService.calculateRankingScore(stats);
        const level = this.expertLevelsService.calculateLevelByScore(rankingScore);
        const tierInfo = this.expertLevelsService.getTierInfo(level);

        // 카테고리 정보 가져오기
        const primaryCategory = expert.categoryLinks?.[0]?.category;
        const specialtyName = expert.specialty || primaryCategory?.nameKo || 'General';

        return {
          expertId: expert.id.toString(),
          expertName: expert.name,
          specialty: specialtyName,
          totalSessions: expert.totalSessions,
          avgRating: expert.ratingAvg,
          reviewCount: expert.reviewCount,
          repeatClients: expert.repeatClients,
          likeCount: 0,
          rankingScore,
          level,
          tierInfo,
          ranking: index + 1, // 임시 순위
        };
      });

      // 랭킹 타입별 정렬
      let sortedRankings = [...rankings];

      switch (rankingType) {
        case 'rating':
          sortedRankings.sort((a, b) => b.avgRating - a.avgRating);
          break;
        case 'sessions':
          sortedRankings.sort((a, b) => b.totalSessions - a.totalSessions);
          break;
        case 'specialty':
        case 'overall':
        default:
          sortedRankings.sort((a, b) => b.rankingScore - a.rankingScore);
          break;
      }

      // 순위 재계산
      sortedRankings = sortedRankings.map((ranking, index) => ({
        ...ranking,
        ranking: index + 1,
      }));

      return {
        success: true,
        data: {
          rankings: sortedRankings,
          rankingType,
          specialty,
        },
      };
    } catch (error) {
      console.error('랭킹 조회 실패:', error);
      return { success: false, error: '랭킹 조회에 실패했습니다.' };
    }
  }

  // 전문가 레벨별 목록 조회
  async getExpertLevels() {
    try {
      const experts = await this.prisma.expert.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          specialty: true,
          totalSessions: true,
          ratingAvg: true,
          reviewCount: true,
          repeatClients: true,
          categoryLinks: {
            include: {
              category: {
                select: {
                  nameKo: true,
                  slug: true,
                },
              },
            },
          },
        },
      });

      const levels = experts.map((expert) => {
        const stats = {
          totalSessions: expert.totalSessions,
          avgRating: expert.ratingAvg,
          reviewCount: expert.reviewCount,
          repeatClients: expert.repeatClients,
          likeCount: 0,
        };

        const rankingScore = this.expertLevelsService.calculateRankingScore(stats);
        const level = this.expertLevelsService.calculateLevelByScore(rankingScore);
        const tierInfo = this.expertLevelsService.getTierInfo(level);
        const levelProgress = this.expertLevelsService.getNextTierProgress(level);

        // 카테고리 정보 가져오기
        const primaryCategory = expert.categoryLinks?.[0]?.category;
        const specialty = expert.specialty || primaryCategory?.nameKo || 'General';

        return {
          expertId: expert.id.toString(),
          expertName: expert.name,
          specialty,
          currentLevel: level,
          tierInfo,
          levelProgress,
          rankingScore,
        };
      });

      return {
        success: true,
        data: { levels },
      };
    } catch (error) {
      console.error('전문가 레벨 목록 조회 실패:', error);
      return { success: false, error: '레벨 목록 조회에 실패했습니다.' };
    }
  }
}