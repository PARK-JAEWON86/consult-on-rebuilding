import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

async function createSampleActivity() {
  console.log('🎯 샘플 활동 데이터 생성 시작...\n');

  try {
    // 사용자 조회 (일반 사용자)
    const users = await prisma.user.findMany({
      where: {
        roles: { equals: ['USER'] }
      },
      select: { id: true },
    });

    // 전문가 조회
    const experts = await prisma.expert.findMany({
      select: { id: true, name: true },
    });

    console.log(`👥 사용자: ${users.length}명, 전문가: ${experts.length}명\n`);

    // 각 전문가별로 다양한 활동량 부여
    const activityLevels = [
      { sessions: 150, reviews: 80 },  // 상위 전문가
      { sessions: 120, reviews: 65 },
      { sessions: 100, reviews: 55 },
      { sessions: 80, reviews: 45 },
      { sessions: 60, reviews: 35 },
      { sessions: 50, reviews: 28 },
      { sessions: 40, reviews: 22 },
      { sessions: 30, reviews: 18 },
      { sessions: 25, reviews: 15 },
      { sessions: 20, reviews: 12 },
      { sessions: 15, reviews: 9 },
      { sessions: 12, reviews: 7 },
      { sessions: 10, reviews: 6 },
      { sessions: 8, reviews: 5 },
      { sessions: 6, reviews: 4 },
    ];

    let expertIndex = 0;

    for (const expert of experts) {
      const activity = activityLevels[expertIndex % activityLevels.length];
      const sessionsToCreate = activity.sessions;
      const reviewsToCreate = activity.reviews;

      console.log(`📝 ${expert.name}: ${sessionsToCreate}개 세션, ${reviewsToCreate}개 리뷰 생성 중...`);

      // 과거 날짜 생성을 위한 기준점
      const now = new Date();
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      // 예약 생성
      const reservations: any[] = [];
      for (let i = 0; i < sessionsToCreate; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const daysAgo = Math.floor(Math.random() * 90); // 0-90일 전
        const hoursOffset = Math.floor(Math.random() * 24); // 0-23시간
        const minutesOffset = Math.floor(Math.random() * 60); // 0-59분
        const sessionDate = new Date(
          threeMonthsAgo.getTime() +
          daysAgo * 24 * 60 * 60 * 1000 +
          hoursOffset * 60 * 60 * 1000 +
          minutesOffset * 60 * 1000
        );
        const endDate = new Date(sessionDate.getTime() + 60 * 60 * 1000); // 1시간 후

        const reservation = await prisma.reservation.create({
          data: {
            displayId: `res-${ulid()}`,
            userId: randomUser.id,
            expertId: expert.id,
            startAt: sessionDate,
            endAt: endDate,
            status: 'CONFIRMED',
            cost: 30000 + Math.floor(Math.random() * 50000),
            note: '상담 완료',
            createdAt: sessionDate,
            updatedAt: sessionDate,
          },
        });

        reservations.push(reservation);
      }

      // 리뷰 생성 (일부 예약에 대해서만)
      const reviewTexts = [
        '매우 전문적이고 도움이 되는 상담이었습니다. 다음에도 꼭 받고 싶어요!',
        '친절하고 자세한 설명 감사합니다. 많은 도움이 되었습니다.',
        '기대 이상의 상담이었습니다. 강력 추천합니다!',
        '실용적인 조언을 많이 받았어요. 감사합니다.',
        '정말 좋은 상담이었습니다. 다시 찾아올게요!',
        '전문가님의 경험과 노하우가 느껴지는 상담이었습니다.',
        '궁금했던 점들을 명확하게 해결할 수 있었습니다.',
        '시간 가는 줄 모르고 집중해서 들었어요. 최고!',
      ];

      for (let i = 0; i < reviewsToCreate; i++) {
        const reservation = reservations[i];
        const rating = 4 + Math.random(); // 4.0 ~ 5.0

        await prisma.review.create({
          data: {
            displayId: ulid(),
            userId: reservation.userId,
            expertId: expert.id,
            reservationId: reservation.id,
            rating: Math.round(rating * 10) / 10,
            content: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
            isPublic: true,
            createdAt: reservation.endAt,
          },
        });
      }

      console.log(`✅ ${expert.name} 완료\n`);
      expertIndex++;
    }

    // 최종 통계
    const totalReservations = await prisma.reservation.count();
    const totalReviews = await prisma.review.count();

    console.log('📊 생성 완료:');
    console.log(`   - 총 예약: ${totalReservations}개`);
    console.log(`   - 총 리뷰: ${totalReviews}개`);

    console.log('\n✅ 샘플 활동 데이터 생성 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  }
}

createSampleActivity()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });