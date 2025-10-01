import { PrismaClient } from '@prisma/client';
import { ExpertLevelsService } from '../src/expert-levels/expert-levels.service';
import { PrismaService } from '../src/prisma/prisma.service';

const prisma = new PrismaClient();

async function updateAllExpertStats() {
  console.log('🔄 전문가 통계 업데이트 시작...\n');

  try {
    // PrismaService 인스턴스 생성
    const prismaService = new PrismaService();
    const expertLevelsService = new ExpertLevelsService(prismaService);

    // 모든 전문가 조회
    const experts = await prisma.expert.findMany({
      select: {
        id: true,
        name: true,
        userId: true,
      },
    });

    console.log(`📋 총 ${experts.length}명의 전문가 발견\n`);

    for (const expert of experts) {
      // 1. 실제 예약 데이터 조회 (CONFIRMED 상태만)
      const confirmedReservations = await prisma.reservation.findMany({
        where: {
          expertId: expert.id,
          status: 'CONFIRMED',
        },
        select: {
          id: true,
          userId: true,
        },
      });

      const totalSessions = confirmedReservations.length;

      // 2. 실제 리뷰 데이터 조회
      const reviews = await prisma.review.findMany({
        where: {
          expertId: expert.id,
          isPublic: true,
        },
        select: {
          rating: true,
        },
      });

      const reviewCount = reviews.length;
      const ratingAvg = reviewCount > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 0;

      // 3. 재방문 고객 계산
      const userIds = confirmedReservations.map(r => r.userId);
      const uniqueUsers = new Set(userIds);
      const repeatClients = userIds.length - uniqueUsers.size;

      // 4. 레벨과 랭킹 점수 계산
      const stats = {
        totalSessions,
        avgRating: ratingAvg,
        reviewCount,
        repeatClients,
        likeCount: 0,
      };

      const rankingScore = expertLevelsService.calculateRankingScore(stats);
      const calculatedLevel = expertLevelsService.calculateLevelByScore(rankingScore);
      const tierInfo = expertLevelsService.getTierInfo(calculatedLevel);

      // 5. 시간당 요금 계산 (티어 기반)
      const hourlyRate = tierInfo.creditsPerMinute * 60;

      // 6. 완료율 계산 (실제 데이터가 없으면 기본값)
      const completionRate = totalSessions > 0 ? 95 : 85;

      // 7. Expert 테이블 업데이트
      await prisma.expert.update({
        where: { id: expert.id },
        data: {
          totalSessions,
          ratingAvg: Math.round(ratingAvg * 10) / 10, // 소수점 1자리
          reviewCount,
          repeatClients,
          completionRate,
          calculatedLevel,
          rankingScore,
          level: tierInfo.name,
          hourlyRate,
          levelUpdatedAt: new Date(),
        },
      });

      console.log(`✅ ${expert.name} 업데이트 완료`);
      console.log(`   - 세션: ${totalSessions}회, 평점: ${ratingAvg.toFixed(1)}, 리뷰: ${reviewCount}개`);
      console.log(`   - 랭킹점수: ${rankingScore.toFixed(2)}, 레벨: ${calculatedLevel}, 티어: ${tierInfo.name}`);
      console.log(`   - 시간당 요금: ${hourlyRate.toLocaleString()}원\n`);
    }

    // 최종 통계
    const updatedExperts = await prisma.expert.findMany({
      select: {
        level: true,
        calculatedLevel: true,
        rankingScore: true,
      },
    });

    const levelDistribution: Record<string, number> = {};
    updatedExperts.forEach(e => {
      const tier = e.level || 'Iron (아이언)';
      levelDistribution[tier] = (levelDistribution[tier] || 0) + 1;
    });

    console.log('📊 최종 티어 분포:');
    Object.entries(levelDistribution)
      .sort((a, b) => b[1] - a[1])
      .forEach(([tier, count]) => {
        console.log(`   ${tier}: ${count}명`);
      });

    const avgLevel = updatedExperts.reduce((sum, e) => sum + (e.calculatedLevel || 1), 0) / updatedExperts.length;
    const avgScore = updatedExperts.reduce((sum, e) => sum + (e.rankingScore || 0), 0) / updatedExperts.length;

    console.log(`\n📈 평균 통계:`);
    console.log(`   - 평균 레벨: ${avgLevel.toFixed(1)}`);
    console.log(`   - 평균 랭킹점수: ${avgScore.toFixed(2)}`);

    console.log('\n✅ 모든 전문가 통계 업데이트 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  }
}

updateAllExpertStats()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });