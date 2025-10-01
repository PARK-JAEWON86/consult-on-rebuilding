const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('시드 데이터 생성 시작...');

  // 전문가와 사용자 ID 가져오기
  const experts = await prisma.expert.findMany({
    take: 5, // 상위 5명의 전문가
    orderBy: { id: 'asc' }
  });

  const users = await prisma.user.findMany({
    take: 3, // 상위 3명의 사용자
    orderBy: { id: 'asc' }
  });

  if (experts.length === 0 || users.length === 0) {
    console.log('전문가 또는 사용자 데이터가 없습니다.');
    return;
  }

  console.log(`전문가 ${experts.length}명, 사용자 ${users.length}명 발견`);

  // 현재 시간 기준으로 다양한 시간대의 예약 생성
  const now = new Date();

  const reservations = [
    // 진행 중인 세션 (15분 전 시작, 45분 후 종료)
    {
      userId: users[0].id,
      expertId: experts[0].id,
      startAt: new Date(now.getTime() - 15 * 60 * 1000),
      endAt: new Date(now.getTime() + 45 * 60 * 1000),
      status: 'CONFIRMED',
      note: '계약서 검토 및 법적 조언'
    },
    // 대기 중인 세션 (10분 후 시작)
    {
      userId: users[1].id,
      expertId: experts[1].id,
      startAt: new Date(now.getTime() + 10 * 60 * 1000),
      endAt: new Date(now.getTime() + 70 * 60 * 1000),
      status: 'CONFIRMED',
      note: '스트레스 관리 및 심리 상담'
    },
    // 오늘 예정된 세션 (2시간 후)
    {
      userId: users[2].id,
      expertId: experts[2].id,
      startAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      endAt: new Date(now.getTime() + 3.5 * 60 * 60 * 1000),
      status: 'CONFIRMED',
      note: '포트폴리오 리밸런싱 상담'
    },
    // 완료된 세션 (오늘 오전)
    {
      userId: users[0].id,
      expertId: experts[3].id,
      startAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0),
      endAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0),
      status: 'CONFIRMED',
      note: '건강검진 결과 상담'
    },
    // 내일 예정된 세션
    {
      userId: users[1].id,
      expertId: experts[4].id,
      startAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      endAt: new Date(now.getTime() + 25 * 60 * 60 * 1000),
      status: 'CONFIRMED',
      note: '진로 상담 및 취업 전략'
    }
  ];

  for (const reservationData of reservations) {
    try {
      const reservation = await prisma.reservation.create({
        data: {
          ...reservationData,
          displayId: `RSV_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          cost: 0 // 비용은 나중에 계산
        }
      });
      console.log(`예약 생성됨: ${reservation.displayId} (${reservationData.note})`);
    } catch (error) {
      console.error('예약 생성 실패:', error.message);
    }
  }

  console.log('시드 데이터 생성 완료!');
}

main()
  .catch((e) => {
    console.error('시드 실행 중 오류:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });