const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function syncReviewCounts() {
  try {
    console.log('🔄 Starting review count synchronization...');

    // 1. 실제 리뷰 개수 집계
    const reviewCounts = await prisma.review.groupBy({
      by: ['expertId'],
      _count: {
        id: true,
      },
      where: {
        isPublic: true, // 공개 리뷰만 카운트
      },
    });

    console.log(`📊 Found reviews for ${reviewCounts.length} experts`);

    // 2. 각 전문가의 reviewCount 업데이트
    let updatedCount = 0;
    for (const item of reviewCounts) {
      const { expertId, _count } = item;
      const actualReviewCount = _count.id;

      // 현재 데이터베이스의 reviewCount 확인
      const expert = await prisma.expert.findUnique({
        where: { id: expertId },
        select: { id: true, name: true, reviewCount: true },
      });

      if (expert) {
        const oldCount = expert.reviewCount;

        // reviewCount 업데이트
        await prisma.expert.update({
          where: { id: expertId },
          data: { reviewCount: actualReviewCount },
        });

        console.log(`✅ Expert ${expert.name} (ID: ${expertId}): ${oldCount} → ${actualReviewCount}`);
        updatedCount++;
      }
    }

    // 3. 리뷰가 없는 전문가들은 reviewCount를 0으로 설정 (선택적)
    const expertsWithoutReviews = await prisma.expert.findMany({
      where: {
        NOT: {
          id: {
            in: reviewCounts.map(item => item.expertId),
          },
        },
        reviewCount: {
          gt: 0, // reviewCount가 0보다 큰 전문가만 업데이트
        },
      },
      select: { id: true, name: true, reviewCount: true },
    });

    for (const expert of expertsWithoutReviews) {
      await prisma.expert.update({
        where: { id: expert.id },
        data: { reviewCount: 0 },
      });

      console.log(`🔄 Expert ${expert.name} (ID: ${expert.id}): ${expert.reviewCount} → 0 (no reviews)`);
      updatedCount++;
    }

    console.log(`\n🎉 Synchronization completed!`);
    console.log(`📈 Updated ${updatedCount} experts`);
    console.log(`📝 Total experts with reviews: ${reviewCounts.length}`);
    console.log(`🔍 Experts reset to 0: ${expertsWithoutReviews.length}`);

  } catch (error) {
    console.error('❌ Error during synchronization:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
if (require.main === module) {
  syncReviewCounts()
    .then(() => {
      console.log('\n✨ Review count synchronization completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Review count synchronization failed:', error);
      process.exit(1);
    });
}

module.exports = { syncReviewCounts };