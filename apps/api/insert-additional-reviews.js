const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function insertAdditionalReviews() {
  try {
    console.log('Creating additional review data for confirmed reservations...');

    // 모든 CONFIRMED 상태의 예약들과 기존 리뷰들 가져오기
    const confirmedReservations = await prisma.reservation.findMany({
      where: { status: 'CONFIRMED' },
      select: { id: true, userId: true, expertId: true, note: true }
    });

    const existingReviews = await prisma.review.findMany({
      select: { reservationId: true }
    });

    const reviewedReservationIds = new Set(existingReviews.map(r => r.reservationId));
    const unreviewedReservations = confirmedReservations.filter(r => !reviewedReservationIds.has(r.id));

    console.log(`Found ${unreviewedReservations.length} confirmed reservations without reviews`);

    // 추가 리뷰 데이터 (기존 SQL 파일의 내용을 현재 구조에 맞게 조정)
    const additionalReviews = [
      // 정민수 (expertId: 6) - 진로상담 전문가의 확정된 예약들에 대한 리뷰
      {
        reservationId: 11, // 취업준비 상담
        rating: 5,
        content: '취업 준비의 길잡이가 되어주셨습니다. 이력서 작성법부터 면접 준비까지 체계적으로 가이드해주셔서 취업 준비에 큰 도움이 되었습니다. 실무 경험을 바탕으로 한 조언이 특히 유용했어요.'
      },
      {
        reservationId: 12, // 이직 상담
        rating: 4,
        content: '이직에 대한 현실적인 조언을 해주셨습니다. 현재 상황을 고려한 이직 시기와 준비사항에 대한 조언이 현실적이었어요. 구체적인 액션 플랜도 제시해주셔서 감사합니다.'
      }
    ];

    console.log(`Inserting ${additionalReviews.length} additional reviews...`);

    for (const reviewData of additionalReviews) {
      // 해당 예약이 실제로 존재하고 CONFIRMED 상태인지 확인
      const reservation = await prisma.reservation.findUnique({
        where: { id: reviewData.reservationId },
        select: { id: true, userId: true, expertId: true, status: true }
      });

      if (!reservation) {
        console.log(`Reservation ${reviewData.reservationId} not found, skipping...`);
        continue;
      }

      if (reservation.status !== 'CONFIRMED') {
        console.log(`Reservation ${reviewData.reservationId} is not confirmed (${reservation.status}), skipping...`);
        continue;
      }

      // 이미 리뷰가 있는지 확인
      const existingReview = await prisma.review.findUnique({
        where: { reservationId: reviewData.reservationId }
      });

      if (existingReview) {
        console.log(`Review already exists for reservation ${reviewData.reservationId}, skipping...`);
        continue;
      }

      // displayId 생성 (ULID 스타일)
      const displayId = `REV${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      const created = await prisma.review.create({
        data: {
          displayId,
          userId: reservation.userId,
          expertId: reservation.expertId,
          reservationId: reviewData.reservationId,
          rating: reviewData.rating,
          content: reviewData.content,
          isPublic: true
        }
      });

      console.log(`Created review: ${created.displayId} - Rating: ${reviewData.rating}/5`);
    }

    console.log('Additional review data insertion completed!');

    // 최종 통계 확인
    const stats = await Promise.all([
      prisma.review.count(),
      prisma.review.groupBy({
        by: ['rating'],
        _count: { rating: true }
      }),
      prisma.reservation.count({ where: { status: 'CONFIRMED' } }),
      prisma.review.count()
    ]);

    console.log(`\nFinal statistics:`);
    console.log(`Total reviews: ${stats[0]}`);
    console.log(`Rating distribution:`);
    stats[1].forEach(stat => {
      console.log(`  ${stat.rating} stars: ${stat._count.rating} reviews`);
    });
    console.log(`Confirmed reservations: ${stats[2]}`);
    console.log(`Confirmed reservations with reviews: ${stats[3]}`);

  } catch (error) {
    console.error('Error inserting additional review data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertAdditionalReviews();