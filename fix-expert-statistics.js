const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixExpertStatistics() {
  try {
    console.log('🔧 실제 관계형 데이터 기반으로 전문가 통계 수정 시작...\n');

    // 모든 전문가 데이터와 관련 관계형 데이터 조회
    const experts = await prisma.expert.findMany({
      select: {
        id: true,
        name: true,
        reviews: {
          select: {
            id: true,
            rating: true,
            isPublic: true,
          }
        },
        reservations: {
          select: {
            id: true,
            status: true,
            userId: true,
          }
        }
      }
    });

    console.log(`📊 ${experts.length}명의 전문가 통계 수정 중...\n`);

    const updates = [];

    for (const expert of experts) {
      // 1. 실제 리뷰 수 계산
      const actualReviewCount = expert.reviews.length;

      // 2. 실제 평점 계산 (공개 리뷰만)
      const publicReviews = expert.reviews.filter(r => r.isPublic);
      const actualRatingAvg = publicReviews.length > 0
        ? publicReviews.reduce((sum, r) => sum + r.rating, 0) / publicReviews.length
        : 0;

      // 3. 실제 세션 수 계산 (완료된 예약만)
      const completedReservations = expert.reservations.filter(r =>
        r.status === 'COMPLETED'
      );
      const actualTotalSessions = completedReservations.length;

      // 4. 재방문 고객 수 계산
      const userIds = completedReservations.map(r => r.userId);
      const uniqueUsers = new Set(userIds);
      const actualRepeatClients = userIds.length - uniqueUsers.size;

      console.log(`${expert.name} (ID: ${expert.id})`);
      console.log(`  리뷰 수: ${actualReviewCount}개 (공개: ${publicReviews.length}개)`);
      console.log(`  평점: ${Math.round(actualRatingAvg * 100) / 100}점`);
      console.log(`  완료 세션: ${actualTotalSessions}회`);
      console.log(`  재방문 고객: ${actualRepeatClients}명`);
      console.log('');

      updates.push({
        id: expert.id,
        reviewCount: actualReviewCount,
        ratingAvg: Math.round(actualRatingAvg * 100) / 100,
        totalSessions: actualTotalSessions,
        repeatClients: actualRepeatClients,
      });
    }

    // 데이터베이스 일괄 업데이트
    console.log('📝 데이터베이스 업데이트 중...');

    for (const update of updates) {
      await prisma.expert.update({
        where: { id: update.id },
        data: {
          reviewCount: update.reviewCount,
          ratingAvg: update.ratingAvg,
          totalSessions: update.totalSessions,
          repeatClients: update.repeatClients,
        }
      });
    }

    console.log('\n✅ 모든 전문가 통계 수정 완료!');

    // 결과 요약
    const summary = {
      totalExperts: updates.length,
      avgReviews: Math.round(updates.reduce((sum, u) => sum + u.reviewCount, 0) / updates.length * 100) / 100,
      avgRating: Math.round(updates.reduce((sum, u) => sum + u.ratingAvg, 0) / updates.length * 100) / 100,
      avgSessions: Math.round(updates.reduce((sum, u) => sum + u.totalSessions, 0) / updates.length * 100) / 100,
      avgRepeatClients: Math.round(updates.reduce((sum, u) => sum + u.repeatClients, 0) / updates.length * 100) / 100,
    };

    console.log('\n📊 수정된 통계 요약:');
    console.log(`  전체 전문가: ${summary.totalExperts}명`);
    console.log(`  평균 리뷰 수: ${summary.avgReviews}개`);
    console.log(`  평균 평점: ${summary.avgRating}점`);
    console.log(`  평균 세션 수: ${summary.avgSessions}회`);
    console.log(`  평균 재방문 고객: ${summary.avgRepeatClients}명`);

  } catch (error) {
    console.error('❌ 통계 수정 중 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixExpertStatistics();