const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function insertConsultationData() {
  try {
    console.log('Creating consultation data using Reservation table...');

    // 전문가와 클라이언트 ID 확인
    const experts = await prisma.expert.findMany({
      take: 8, // 처음 8명의 전문가 사용
      select: { id: true, name: true, title: true }
    });

    // USER 역할을 가진 사용자들 찾기 (클라이언트들)
    const allUsers = await prisma.user.findMany({
      select: { id: true, name: true, roles: true }
    });

    const clients = allUsers.filter(user => {
      const roles = JSON.parse(user.roles);
      return roles.includes('USER');
    }).slice(0, 20);

    console.log('Using experts:', experts.map(e => `${e.name}(${e.id})`).join(', '));
    console.log('Using clients:', clients.map(c => `${c.name}(${c.id})`).join(', '));

    // 상담 예약 데이터 생성
    const reservations = [
      // 김민지 (expertId: 2) - 심리상담 전문가
      {
        userId: clients[0].id, expertId: 2,
        startAt: new Date('2025-09-10T14:00:00Z'),
        endAt: new Date('2025-09-10T15:00:00Z'),
        status: 'CONFIRMED', cost: 50000, note: '스트레스 관리 상담'
      },
      {
        userId: clients[1].id, expertId: 2,
        startAt: new Date('2025-09-12T10:00:00Z'),
        endAt: new Date('2025-09-12T10:45:00Z'),
        status: 'CONFIRMED', cost: 37500, note: '대인관계 상담'
      },
      {
        userId: clients[2].id, expertId: 2,
        startAt: new Date('2025-09-25T15:00:00Z'),
        endAt: new Date('2025-09-25T16:30:00Z'),
        status: 'PENDING', cost: 75000, note: '불안장애 상담'
      },

      // 이준호 (expertId: 3) - 법률상담 전문가
      {
        userId: clients[3].id, expertId: 3,
        startAt: new Date('2025-09-11T16:00:00Z'),
        endAt: new Date('2025-09-11T17:00:00Z'),
        status: 'CONFIRMED', cost: 60000, note: '계약서 검토 상담'
      },
      {
        userId: clients[4].id, expertId: 3,
        startAt: new Date('2025-09-13T11:00:00Z'),
        endAt: new Date('2025-09-13T12:15:00Z'),
        status: 'CONFIRMED', cost: 75000, note: '상속 문제 상담'
      },
      {
        userId: clients[5].id, expertId: 3,
        startAt: new Date('2025-09-26T10:00:00Z'),
        endAt: new Date('2025-09-26T11:30:00Z'),
        status: 'PENDING', cost: 90000, note: '회사법 상담'
      },

      // 박서준 (expertId: 4) - 재무상담 전문가
      {
        userId: clients[6].id, expertId: 4,
        startAt: new Date('2025-09-09T15:30:00Z'),
        endAt: new Date('2025-09-09T16:30:00Z'),
        status: 'CONFIRMED', cost: 50000, note: '투자 포트폴리오 상담'
      },
      {
        userId: clients[7].id, expertId: 4,
        startAt: new Date('2025-09-19T14:00:00Z'),
        endAt: new Date('2025-09-19T15:15:00Z'),
        status: 'CONFIRMED', cost: 62500, note: '자산관리 상담'
      },

      // 최유진 (expertId: 5) - 건강상담 전문가
      {
        userId: clients[8].id, expertId: 5,
        startAt: new Date('2025-09-08T11:00:00Z'),
        endAt: new Date('2025-09-08T12:00:00Z'),
        status: 'CONFIRMED', cost: 45000, note: '체중관리 상담'
      },
      {
        userId: clients[9].id, expertId: 5,
        startAt: new Date('2025-09-12T15:00:00Z'),
        endAt: new Date('2025-09-12T15:45:00Z'),
        status: 'CONFIRMED', cost: 33750, note: '운동처방 상담'
      },

      // 정민수 (expertId: 6) - 진로상담 전문가
      {
        userId: clients[10].id, expertId: 6,
        startAt: new Date('2025-09-07T14:30:00Z'),
        endAt: new Date('2025-09-07T16:00:00Z'),
        status: 'CONFIRMED', cost: 67500, note: '취업준비 상담'
      },
      {
        userId: clients[11].id, expertId: 6,
        startAt: new Date('2025-09-11T10:00:00Z'),
        endAt: new Date('2025-09-11T11:00:00Z'),
        status: 'CONFIRMED', cost: 45000, note: '이직 상담'
      },

      // 추가 예약들 (미래 일정)
      {
        userId: clients[12].id, expertId: 7,
        startAt: new Date('2025-09-28T14:00:00Z'),
        endAt: new Date('2025-09-28T15:00:00Z'),
        status: 'PENDING', cost: 50000, note: '심리 상담'
      },
      {
        userId: clients[13].id, expertId: 8,
        startAt: new Date('2025-09-29T16:00:00Z'),
        endAt: new Date('2025-09-29T17:00:00Z'),
        status: 'PENDING', cost: 60000, note: '법률 자문'
      },
      {
        userId: clients[14].id, expertId: 9,
        startAt: new Date('2025-09-30T11:00:00Z'),
        endAt: new Date('2025-09-30T12:00:00Z'),
        status: 'PENDING', cost: 55000, note: '재무 설계'
      }
    ];

    console.log(`Inserting ${reservations.length} reservations...`);

    for (const reservation of reservations) {
      // displayId 생성 (ULID 스타일)
      const displayId = `RES${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      const created = await prisma.reservation.create({
        data: {
          displayId,
          userId: reservation.userId,
          expertId: reservation.expertId,
          startAt: reservation.startAt,
          endAt: reservation.endAt,
          status: reservation.status,
          cost: reservation.cost,
          note: reservation.note
        }
      });

      console.log(`Created reservation: ${created.displayId} - ${reservation.note}`);
    }

    // 리뷰 데이터도 추가 (완료된 상담에 대해)
    console.log('Adding reviews for completed consultations...');

    const completedReservations = await prisma.reservation.findMany({
      where: { status: 'CONFIRMED' },
      take: 8
    });

    const reviews = [
      { rating: 5, content: '정말 도움이 되었습니다. 스트레스 관리 방법을 구체적으로 알려주셔서 감사합니다.' },
      { rating: 5, content: '대인관계 개선에 많은 도움이 되었습니다. 추천합니다!' },
      { rating: 5, content: '전문적이고 상세한 검토로 안심할 수 있었습니다.' },
      { rating: 5, content: '복잡한 상속 문제를 명확하게 설명해주셔서 감사합니다.' },
      { rating: 4, content: '투자에 대한 기본기를 잘 알려주셨습니다.' },
      { rating: 5, content: '체계적인 자산관리 계획을 세울 수 있었습니다.' },
      { rating: 5, content: '실용적이고 건강한 다이어트 방법을 알려주셨습니다.' },
      { rating: 4, content: '운동 초보자에게 정말 도움이 되었습니다.' }
    ];

    for (let i = 0; i < Math.min(completedReservations.length, reviews.length); i++) {
      const reservation = completedReservations[i];
      const review = reviews[i];

      const displayId = `REV${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      await prisma.review.create({
        data: {
          displayId,
          userId: reservation.userId,
          expertId: reservation.expertId,
          reservationId: reservation.id,
          rating: review.rating,
          content: review.content,
          isPublic: true
        }
      });

      console.log(`Created review for reservation ${reservation.displayId}: ${review.rating} stars`);
    }

    console.log('Consultation data insertion completed!');

    // 통계 확인
    const stats = await Promise.all([
      prisma.reservation.count(),
      prisma.review.count(),
      prisma.reservation.count({ where: { status: 'CONFIRMED' } }),
      prisma.reservation.count({ where: { status: 'PENDING' } })
    ]);

    console.log(`Total reservations: ${stats[0]}`);
    console.log(`Total reviews: ${stats[1]}`);
    console.log(`Confirmed reservations: ${stats[2]}`);
    console.log(`Pending reservations: ${stats[3]}`);

  } catch (error) {
    console.error('Error inserting consultation data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertConsultationData();