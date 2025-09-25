const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function insertReservationData() {
  try {
    console.log('Inserting reservation data dynamically...');

    // 기존 데이터 확인
    const existingReservations = await prisma.reservation.count();
    console.log(`Current reservations: ${existingReservations}`);

    // 현재 사용자와 전문가 데이터 조회
    const users = await prisma.user.findMany({
      select: { id: true, name: true },
      where: { id: { gte: 32, lte: 56 } },
      orderBy: { id: 'asc' }
    });

    const experts = await prisma.expert.findMany({
      select: { id: true, name: true },
      orderBy: { id: 'asc' }
    });

    console.log(`Found ${users.length} client users (IDs 32-56) and ${experts.length} experts`);

    // SQL 데이터를 현재 DB 구조에 맞게 변환
    // Expert ID 매핑: SQL expert ID 1-30 → DB expert ID 2-31
    const reservationData = [
      // 완료된 예약들 (1-25)
      { userId: 32, sqlExpertId: 1, startAt: '2025-09-18 14:00:00', endAt: '2025-09-18 15:00:00', status: 'CONFIRMED', cost: 60000, note: '스트레스 관리에 대한 상담' },
      { userId: 33, sqlExpertId: 2, startAt: '2025-09-18 16:00:00', endAt: '2025-09-18 17:00:00', status: 'CONFIRMED', cost: 55000, note: '자녀 양육 고민 상담' },
      { userId: 34, sqlExpertId: 4, startAt: '2025-09-17 10:00:00', endAt: '2025-09-17 11:30:00', status: 'CONFIRMED', cost: 90000, note: '계약서 검토 및 법률 자문' },
      { userId: 35, sqlExpertId: 7, startAt: '2025-09-16 15:30:00', endAt: '2025-09-16 16:30:00', status: 'CONFIRMED', cost: 70000, note: '투자 포트폴리오 상담' },
      { userId: 36, sqlExpertId: 10, startAt: '2025-09-19 11:00:00', endAt: '2025-09-19 12:00:00', status: 'CONFIRMED', cost: 50000, note: '건강한 식단 관리 상담' },
      { userId: 37, sqlExpertId: 13, startAt: '2025-09-19 13:30:00', endAt: '2025-09-19 14:30:00', status: 'CONFIRMED', cost: 45000, note: '취업 준비 전략 상담' },
      { userId: 38, sqlExpertId: 16, startAt: '2025-09-18 09:30:00', endAt: '2025-09-18 11:00:00', status: 'CONFIRMED', cost: 85000, note: 'React 프로젝트 아키텍처 상담' },
      { userId: 39, sqlExpertId: 19, startAt: '2025-09-17 14:00:00', endAt: '2025-09-17 15:30:00', status: 'CONFIRMED', cost: 65000, note: '자녀 교육 방향 상담' },
      { userId: 40, sqlExpertId: 22, startAt: '2025-09-16 10:30:00', endAt: '2025-09-16 12:00:00', status: 'CONFIRMED', cost: 80000, note: '온라인 비즈니스 전략 상담' },
      { userId: 41, sqlExpertId: 25, startAt: '2025-09-19 15:00:00', endAt: '2025-09-19 16:00:00', status: 'CONFIRMED', cost: 55000, note: 'UI/UX 디자인 피드백' },
      { userId: 42, sqlExpertId: 28, startAt: '2025-09-18 11:30:00', endAt: '2025-09-18 12:30:00', status: 'CONFIRMED', cost: 40000, note: '영어 회화 학습법 상담' },
      { userId: 43, sqlExpertId: 3, startAt: '2025-09-17 16:30:00', endAt: '2025-09-17 17:30:00', status: 'CONFIRMED', cost: 50000, note: '진로 고민 상담' },
      { userId: 44, sqlExpertId: 5, startAt: '2025-09-19 09:00:00', endAt: '2025-09-19 10:30:00', status: 'CONFIRMED', cost: 75000, note: '사업자등록 관련 법률 상담' },
      { userId: 45, sqlExpertId: 8, startAt: '2025-09-18 13:00:00', endAt: '2025-09-18 14:00:00', status: 'CONFIRMED', cost: 60000, note: '부동산 투자 전략 상담' },
      { userId: 46, sqlExpertId: 11, startAt: '2025-09-17 11:00:00', endAt: '2025-09-17 12:00:00', status: 'CONFIRMED', cost: 45000, note: '다이어트 식단 관리 상담' },
      { userId: 47, sqlExpertId: 14, startAt: '2025-09-19 10:00:00', endAt: '2025-09-19 11:30:00', status: 'CONFIRMED', cost: 70000, note: 'Node.js 백엔드 개발 상담' },
      { userId: 48, sqlExpertId: 17, startAt: '2025-09-18 15:30:00', endAt: '2025-09-18 16:30:00', status: 'CONFIRMED', cost: 55000, note: '유튜브 영상 제작 상담' },
      { userId: 49, sqlExpertId: 20, startAt: '2025-09-17 13:30:00', endAt: '2025-09-17 14:30:00', status: 'CONFIRMED', cost: 50000, note: '일본어 학습 계획 상담' },
      { userId: 50, sqlExpertId: 23, startAt: '2025-09-19 14:00:00', endAt: '2025-09-19 15:30:00', status: 'CONFIRMED', cost: 75000, note: '스타트업 마케팅 전략 상담' },
      { userId: 51, sqlExpertId: 26, startAt: '2025-09-18 10:00:00', endAt: '2025-09-18 11:00:00', status: 'CONFIRMED', cost: 60000, note: '브랜딩 디자인 상담' },
      { userId: 52, sqlExpertId: 29, startAt: '2025-09-17 15:00:00', endAt: '2025-09-17 16:00:00', status: 'CONFIRMED', cost: 45000, note: '중국어 비즈니스 회화 상담' },
      { userId: 53, sqlExpertId: 6, startAt: '2025-09-19 11:30:00', endAt: '2025-09-19 12:30:00', status: 'CONFIRMED', cost: 70000, note: '특허 출원 절차 상담' },
      { userId: 54, sqlExpertId: 9, startAt: '2025-09-18 14:30:00', endAt: '2025-09-18 15:30:00', status: 'CONFIRMED', cost: 65000, note: '연금 투자 계획 상담' },
      { userId: 55, sqlExpertId: 12, startAt: '2025-09-17 09:30:00', endAt: '2025-09-17 10:30:00', status: 'CONFIRMED', cost: 50000, note: '운동 프로그램 설계 상담' },
      { userId: 56, sqlExpertId: 15, startAt: '2025-09-19 16:30:00', endAt: '2025-09-19 17:30:00', status: 'CONFIRMED', cost: 55000, note: '대학원 진학 상담' },

      // 예정된 예약들 (26-35)
      { userId: 32, sqlExpertId: 18, startAt: '2025-09-21 14:00:00', endAt: '2025-09-21 15:30:00', status: 'CONFIRMED', cost: 70000, note: 'Python 데이터 분석 상담' },
      { userId: 33, sqlExpertId: 21, startAt: '2025-09-22 10:30:00', endAt: '2025-09-22 11:30:00', status: 'CONFIRMED', cost: 50000, note: '온라인 교육 콘텐츠 제작 상담' },
      { userId: 34, sqlExpertId: 24, startAt: '2025-09-21 16:00:00', endAt: '2025-09-21 17:00:00', status: 'CONFIRMED', cost: 75000, note: 'B2B 세일즈 전략 상담' },
      { userId: 35, sqlExpertId: 27, startAt: '2025-09-22 13:30:00', endAt: '2025-09-22 14:30:00', status: 'CONFIRMED', cost: 55000, note: '모바일 앱 UI/UX 상담' },
      { userId: 36, sqlExpertId: 30, startAt: '2025-09-21 11:00:00', endAt: '2025-09-21 12:00:00', status: 'CONFIRMED', cost: 40000, note: '독일어 학습 계획 상담' },
      { userId: 37, sqlExpertId: 1, startAt: '2025-09-23 15:30:00', endAt: '2025-09-23 16:30:00', status: 'PENDING', cost: 60000, note: '업무 스트레스 관리 상담' },
      { userId: 38, sqlExpertId: 4, startAt: '2025-09-22 09:00:00', endAt: '2025-09-22 10:30:00', status: 'PENDING', cost: 90000, note: '근로계약 검토 상담' },
      { userId: 39, sqlExpertId: 7, startAt: '2025-09-21 14:30:00', endAt: '2025-09-21 15:30:00', status: 'PENDING', cost: 70000, note: '주식 투자 전략 상담' },
      { userId: 40, sqlExpertId: 10, startAt: '2025-09-23 11:30:00', endAt: '2025-09-23 12:30:00', status: 'PENDING', cost: 50000, note: '영양 상담 및 식단 관리' },
      { userId: 41, sqlExpertId: 13, startAt: '2025-09-22 16:00:00', endAt: '2025-09-22 17:00:00', status: 'PENDING', cost: 45000, note: '이직 준비 전략 상담' },

      // 취소된 예약들 (36-40)
      { userId: 42, sqlExpertId: 16, startAt: '2025-09-20 10:00:00', endAt: '2025-09-20 11:30:00', status: 'CANCELED', cost: 85000, note: 'Vue.js 프로젝트 리팩토링 상담' },
      { userId: 43, sqlExpertId: 19, startAt: '2025-09-21 13:00:00', endAt: '2025-09-21 14:30:00', status: 'CANCELED', cost: 65000, note: '홈스쿨링 교육 방법 상담' },
      { userId: 44, sqlExpertId: 22, startAt: '2025-09-20 15:30:00', endAt: '2025-09-20 17:00:00', status: 'CANCELED', cost: 80000, note: '이커머스 사업 전략 상담' },
      { userId: 45, sqlExpertId: 25, startAt: '2025-09-21 09:30:00', endAt: '2025-09-21 10:30:00', status: 'CANCELED', cost: 55000, note: '포트폴리오 디자인 리뷰' },
      { userId: 46, sqlExpertId: 28, startAt: '2025-09-22 14:00:00', endAt: '2025-09-22 15:00:00', status: 'CANCELED', cost: 40000, note: 'TOEIC 스피킹 향상 상담' }
    ];

    // displayId 생성 함수
    function generateDisplayId() {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = 'RSV_';
      for (let i = 0; i < 12; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }

    // 예약 데이터 삽입
    let insertedCount = 0;
    let skippedCount = 0;

    console.log(`Processing ${reservationData.length} reservations...`);

    for (const reservation of reservationData) {
      try {
        // Expert ID 매핑: SQL ID + 1 = DB ID
        const dbExpertId = reservation.sqlExpertId + 1;

        // 사용자와 전문가 존재 확인
        const user = users.find(u => u.id === reservation.userId);
        const expert = experts.find(e => e.id === dbExpertId);

        if (!user) {
          console.log(`User ${reservation.userId} not found, skipping reservation...`);
          skippedCount++;
          continue;
        }

        if (!expert) {
          console.log(`Expert ${dbExpertId} (SQL ID: ${reservation.sqlExpertId}) not found, skipping reservation...`);
          skippedCount++;
          continue;
        }

        // 중복 예약 확인 (같은 사용자, 전문가, 시간)
        const existingReservation = await prisma.reservation.findFirst({
          where: {
            userId: reservation.userId,
            expertId: dbExpertId,
            startAt: new Date(reservation.startAt)
          }
        });

        if (existingReservation) {
          console.log(`Reservation already exists for user ${reservation.userId} and expert ${dbExpertId} at ${reservation.startAt}, skipping...`);
          skippedCount++;
          continue;
        }

        // 예약 생성
        const createdReservation = await prisma.reservation.create({
          data: {
            displayId: generateDisplayId(),
            userId: reservation.userId,
            expertId: dbExpertId,
            startAt: new Date(reservation.startAt),
            endAt: new Date(reservation.endAt),
            status: reservation.status,
            cost: reservation.cost,
            note: reservation.note
          }
        });

        insertedCount++;
        console.log(`Created reservation: ${user.name} -> ${expert.name} (${reservation.status}) at ${reservation.startAt}`);

      } catch (error) {
        console.error(`Failed to create reservation for user ${reservation.userId}:`, error.message);
        skippedCount++;
      }
    }

    console.log(`\nReservation insertion completed!`);
    console.log(`Successfully inserted: ${insertedCount} reservations`);
    console.log(`Skipped: ${skippedCount} reservations`);

    // 최종 통계 확인
    const finalStats = await Promise.all([
      prisma.reservation.count(),
      prisma.reservation.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      prisma.reservation.aggregate({
        _avg: { cost: true },
        _sum: { cost: true }
      })
    ]);

    console.log(`\nFinal reservation statistics:`);
    console.log(`Total reservations: ${finalStats[0]}`);
    console.log(`Status distribution:`);
    finalStats[1].forEach(stat => {
      console.log(`  ${stat.status}: ${stat._count.status} reservations`);
    });
    console.log(`Average cost: ₩${Math.round(finalStats[2]._avg.cost || 0).toLocaleString()}`);
    console.log(`Total revenue: ₩${Math.round(finalStats[2]._sum.cost || 0).toLocaleString()}`);

  } catch (error) {
    console.error('Error inserting reservation data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertReservationData();