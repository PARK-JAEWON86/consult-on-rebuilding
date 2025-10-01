const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDataConsistency() {
  try {
    console.log('🔍 실제 관계형 데이터와 하드코딩된 통계 필드 간 일관성 검증\n');

    // 모든 전문가 데이터와 관련 관계형 데이터 조회
    const experts = await prisma.expert.findMany({
      select: {
        id: true,
        name: true,
        // 현재 하드코딩된 통계 필드들
        reviewCount: true,
        ratingAvg: true,
        totalSessions: true,
        repeatClients: true,
        // 관계형 데이터
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

    console.log(`📊 ${experts.length}명의 전문가 데이터 일관성 검증 중...\n`);

    let inconsistencyCount = 0;
    const inconsistencies = [];

    for (const expert of experts) {
      const issues = [];

      // 1. 실제 리뷰 수 vs reviewCount 필드 비교
      const actualReviewCount = expert.reviews.length;
      const storedReviewCount = expert.reviewCount || 0;

      if (actualReviewCount !== storedReviewCount) {
        issues.push({
          type: 'reviewCount',
          actual: actualReviewCount,
          stored: storedReviewCount,
          difference: actualReviewCount - storedReviewCount
        });
      }

      // 2. 실제 평점 계산 vs ratingAvg 필드 비교
      const publicReviews = expert.reviews.filter(r => r.isPublic);
      const actualRating = publicReviews.length > 0
        ? publicReviews.reduce((sum, r) => sum + r.rating, 0) / publicReviews.length
        : 0;
      const storedRating = expert.ratingAvg || 0;

      if (Math.abs(actualRating - storedRating) > 0.1) {
        issues.push({
          type: 'ratingAvg',
          actual: Math.round(actualRating * 100) / 100,
          stored: Math.round(storedRating * 100) / 100,
          difference: Math.round((actualRating - storedRating) * 100) / 100
        });
      }

      // 3. 실제 예약 수 vs totalSessions 필드 비교
      const completedReservations = expert.reservations.filter(r =>
        r.status === 'COMPLETED'
      );
      const actualSessionCount = completedReservations.length;
      const storedSessionCount = expert.totalSessions || 0;

      if (actualSessionCount !== storedSessionCount) {
        issues.push({
          type: 'totalSessions',
          actual: actualSessionCount,
          stored: storedSessionCount,
          difference: actualSessionCount - storedSessionCount
        });
      }

      // 4. 재방문 고객 수 계산 (같은 사용자의 여러 예약)
      const userIds = completedReservations.map(r => r.userId);
      const uniqueUsers = new Set(userIds);
      const repeatClientCount = userIds.length - uniqueUsers.size;
      const storedRepeatClients = expert.repeatClients || 0;

      if (repeatClientCount !== storedRepeatClients) {
        issues.push({
          type: 'repeatClients',
          actual: repeatClientCount,
          stored: storedRepeatClients,
          difference: repeatClientCount - storedRepeatClients
        });
      }

      if (issues.length > 0) {
        inconsistencyCount++;
        inconsistencies.push({
          expert: {
            id: expert.id,
            name: expert.name
          },
          issues
        });

        console.log(`❌ ${expert.name} (ID: ${expert.id}) - ${issues.length}개 불일치 발견:`);
        issues.forEach(issue => {
          const diffSign = issue.difference > 0 ? '+' : '';
          console.log(`   ${issue.type}: 실제=${issue.actual}, 저장된값=${issue.stored}, 차이=${diffSign}${issue.difference}`);
        });
        console.log('');
      } else {
        console.log(`✅ ${expert.name} (ID: ${expert.id}) - 데이터 일관성 정상`);
      }
    }

    console.log(`\n📈 검증 결과 요약:`);
    console.log(`  총 전문가 수: ${experts.length}명`);
    console.log(`  일관성 문제 전문가: ${inconsistencyCount}명`);
    console.log(`  일관성 정상 전문가: ${experts.length - inconsistencyCount}명`);

    if (inconsistencies.length > 0) {
      console.log(`\n🔧 수정 필요한 통계 유형별 요약:`);
      const typeStats = {};
      inconsistencies.forEach(item => {
        item.issues.forEach(issue => {
          if (!typeStats[issue.type]) {
            typeStats[issue.type] = { count: 0, totalDiff: 0 };
          }
          typeStats[issue.type].count++;
          typeStats[issue.type].totalDiff += Math.abs(issue.difference);
        });
      });

      Object.entries(typeStats).forEach(([type, stats]) => {
        console.log(`  ${type}: ${stats.count}명, 평균 차이: ${Math.round(stats.totalDiff / stats.count * 100) / 100}`);
      });
    }

  } catch (error) {
    console.error('❌ 데이터 일관성 검증 중 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDataConsistency();