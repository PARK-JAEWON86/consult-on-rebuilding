const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSettlementsData() {
  try {
    console.log('Checking current settlements-related data consistency...');

    // 1. 현재 전문가 데이터 확인 (ID 매핑 중요)
    const experts = await prisma.expert.findMany({
      select: {
        id: true,
        name: true,
        ratePerMin: true,
        hourlyRate: true,
        totalSessions: true,
        reviewCount: true
      },
      orderBy: { id: 'asc' }
    });

    console.log(`\nCurrent experts: ${experts.length}`);
    console.log('Expert IDs range:', experts.length > 0 ? `${experts[0].id} - ${experts[experts.length - 1].id}` : 'None');

    // SQL의 expert ID 1-12가 현재 DB의 어떤 ID에 매핑되는지 확인
    console.log('\nSQL -> DB Expert ID mapping (first 12):');
    experts.slice(0, 12).forEach((expert, index) => {
      console.log(`  SQL ID ${index + 1} -> DB ID ${expert.id}: ${expert.name} (${expert.ratePerMin}/min, ${expert.hourlyRate}/hour)`);
    });

    // 2. 현재 사용자 데이터 확인 (전문가들이 사용자이기도 함)
    const users = await prisma.user.findMany({
      select: { id: true, name: true, roles: true },
      where: { id: { lte: 31 } }, // 관리자 + 전문가들
      orderBy: { id: 'asc' }
    });

    console.log(`\nUsers (including experts): ${users.length}`);
    console.log('User IDs range:', users.length > 0 ? `${users[0].id} - ${users[users.length - 1].id}` : 'None');

    // 3. 현재 예약 데이터 통계
    const reservationStats = await Promise.all([
      prisma.reservation.count(),
      prisma.reservation.count({ where: { id: { gte: 3000 } } }),
      prisma.reservation.findFirst({
        select: { id: true },
        orderBy: { id: 'desc' }
      })
    ]);

    console.log(`\nReservation statistics:`);
    console.log(`  Total reservations: ${reservationStats[0]}`);
    console.log(`  Reservations with ID >= 3000: ${reservationStats[1]}`);
    console.log(`  Last reservation ID: ${reservationStats[2]?.id || 'None'}`);

    // 4. 현재 크레딧 트랜잭션 통계
    const creditStats = await Promise.all([
      prisma.creditTransaction.count(),
      prisma.creditTransaction.groupBy({
        by: ['reason'],
        _count: { reason: true }
      })
    ]);

    console.log(`\nCredit transaction statistics:`);
    console.log(`  Total transactions: ${creditStats[0]}`);
    console.log(`  By reason:`);
    creditStats[1].forEach(stat => {
      console.log(`    ${stat.reason}: ${stat._count.reason} transactions`);
    });

    // 5. 현재 리뷰 데이터
    const reviewStats = await Promise.all([
      prisma.review.count(),
      prisma.review.count({ where: { id: { gte: 200 } } }),
      prisma.review.findFirst({
        select: { id: true },
        orderBy: { id: 'desc' }
      })
    ]);

    console.log(`\nReview statistics:`);
    console.log(`  Total reviews: ${reviewStats[0]}`);
    console.log(`  Reviews with ID >= 200: ${reviewStats[1]}`);
    console.log(`  Last review ID: ${reviewStats[2]?.id || 'None'}`);

    // 6. 현재 세션 데이터
    const sessionStats = await Promise.all([
      prisma.session.count(),
      prisma.session.count({ where: { id: { gte: 200 } } }),
      prisma.session.findFirst({
        select: { id: true },
        orderBy: { id: 'desc' }
      })
    ]);

    console.log(`\nSession statistics:`);
    console.log(`  Total sessions: ${sessionStats[0]}`);
    console.log(`  Sessions with ID >= 200: ${sessionStats[1]}`);
    console.log(`  Last session ID: ${sessionStats[2]?.id || 'None'}`);

    // 7. ID 충돌 가능성 분석
    console.log(`\n=== ID Conflict Analysis ===`);

    const potentialConflicts = {
      reservations: reservationStats[1] > 0,
      reviews: reviewStats[1] > 0,
      sessions: sessionStats[1] > 0
    };

    Object.entries(potentialConflicts).forEach(([table, hasConflict]) => {
      console.log(`  ${table}: ${hasConflict ? '⚠️ Potential ID conflicts' : '✅ No conflicts'}`);
    });

    // 8. 2025년 데이터 변환 미리보기
    console.log(`\n=== 2025 Date Conversion Preview ===`);
    const sampleDates = [
      '2024-01-15 14:00:00',
      '2024-06-03 16:00:00',
      '2024-08-20 12:00:00'
    ];

    sampleDates.forEach(date => {
      const newDate = date.replace('2024', '2025');
      console.log(`  ${date} -> ${newDate}`);
    });

  } catch (error) {
    console.error('Error checking settlements data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSettlementsData();