const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function insertMoreConsultationReviews() {
  try {
    console.log('Creating additional consultation reservations and reviews...');

    // 사용자와 전문가 정보 가져오기
    const experts = await prisma.expert.findMany({
      select: { id: true, name: true }
    });

    const allUsers = await prisma.user.findMany({
      select: { id: true, name: true, roles: true }
    });

    const clients = allUsers.filter(user => {
      const roles = JSON.parse(user.roles);
      return roles.includes('USER');
    });

    console.log(`Found ${experts.length} experts and ${clients.length} clients`);

    // SQL 파일의 리뷰 데이터를 바탕으로 추가 예약 및 리뷰 생성
    const consultationData = [
      // 김태환 (expertId: 7) - IT상담
      {
        expertId: 7, userId: clients[15].id,
        startAt: new Date('2025-09-06T17:30:00Z'),
        endAt: new Date('2025-09-06T18:30:00Z'),
        status: 'CONFIRMED', cost: 60000, note: 'React 개발 학습 상담',
        review: { rating: 5, content: 'React 학습 계획을 단계별로 제시해주셔서 어디서부터 시작해야 할지 알 수 있었습니다. 실전 프로젝트 예시도 도움이 되었어요.' }
      },
      {
        expertId: 7, userId: clients[16].id,
        startAt: new Date('2025-09-10T10:15:00Z'),
        endAt: new Date('2025-09-10T11:15:00Z'),
        status: 'CONFIRMED', cost: 60000, note: 'DB 설계 상담',
        review: { rating: 5, content: '데이터베이스 설계에 대한 전문적인 조언이 정말 유용했습니다. 정규화와 성능 최적화를 고려한 설계 방안이 구체적이었어요.' }
      },

      // 이수연 (expertId: 8) - 디자인상담
      {
        expertId: 8, userId: clients[17].id,
        startAt: new Date('2025-09-05T16:45:00Z'),
        endAt: new Date('2025-09-05T17:45:00Z'),
        status: 'CONFIRMED', cost: 55000, note: 'UI/UX 디자인 상담',
        review: { rating: 5, content: 'UI/UX 디자인 개선 방안이 정말 전문적이었습니다. 사용자 경험을 고려한 디자인 시각이 인상적이었어요. 포트폴리오도 훌륭했어요.' }
      },
      {
        expertId: 8, userId: clients[18].id,
        startAt: new Date('2025-09-09T12:30:00Z'),
        endAt: new Date('2025-09-09T13:30:00Z'),
        status: 'CONFIRMED', cost: 55000, note: '브랜딩 디자인 상담',
        review: { rating: 4, content: '브랜드 정체성에 맞는 로고와 디자인 가이드라인을 체계적으로 제시해주셔서 브랜딩 방향을 명확히 할 수 있었습니다.' }
      },

      // 박동훈 (expertId: 9) - 사업상담
      {
        expertId: 9, userId: clients[19].id,
        startAt: new Date('2025-09-04T16:30:00Z'),
        endAt: new Date('2025-09-04T17:30:00Z'),
        status: 'CONFIRMED', cost: 70000, note: '창업 상담',
        review: { rating: 5, content: '사업계획서 작성 방법을 투자자 관점에서 알려주셔서 정말 유용했습니다. 놓치기 쉬운 핵심 요소들을 꼼꼼히 짚어주셨어요.' }
      },
      {
        expertId: 9, userId: clients[0].id,
        startAt: new Date('2025-09-08T17:30:00Z'),
        endAt: new Date('2025-09-08T18:30:00Z'),
        status: 'CONFIRMED', cost: 70000, note: '마케팅 전략 상담',
        review: { rating: 5, content: '타겟 고객 분석부터 마케팅 채널 전략까지 체계적으로 알려주셔서 마케팅 계획을 구체화할 수 있었습니다. 실무 경험이 풍부하신 것 같아요.' }
      },

      // 김나영 (expertId: 10) - 언어상담
      {
        expertId: 10, userId: clients[1].id,
        startAt: new Date('2025-09-03T20:30:00Z'),
        endAt: new Date('2025-09-03T21:30:00Z'),
        status: 'CONFIRMED', cost: 45000, note: '영어 회화 상담',
        review: { rating: 4, content: '개인 수준에 맞는 영어 회화 학습 계획이 실용적이었습니다. 실전 연습 방법도 구체적으로 알려주셔서 도움이 되었어요.' }
      },
      {
        expertId: 10, userId: clients[2].id,
        startAt: new Date('2025-09-07T21:15:00Z'),
        endAt: new Date('2025-09-07T22:15:00Z'),
        status: 'CONFIRMED', cost: 45000, note: '중국어 기초 상담',
        review: { rating: 4, content: '중국어를 처음 배우는데 기초부터 체계적으로 알려주셔서 학습 방향을 잡을 수 있었습니다. 발음 교정도 도움이 되었어요.' }
      },

      // 추가 상담들 (다양한 전문가들)
      {
        expertId: 2, userId: clients[3].id,
        startAt: new Date('2025-09-15T14:00:00Z'),
        endAt: new Date('2025-09-15T15:00:00Z'),
        status: 'CONFIRMED', cost: 50000, note: '감정 조절 상담',
        review: { rating: 4, content: '감정 조절 방법을 배우면서 일상생활이 많이 편해졌습니다. 전문적이면서도 따뜻한 상담이었어요.' }
      },
      {
        expertId: 3, userId: clients[4].id,
        startAt: new Date('2025-09-16T11:00:00Z'),
        endAt: new Date('2025-09-16T12:00:00Z'),
        status: 'CONFIRMED', cost: 60000, note: '계약서 분석 상담',
        review: { rating: 5, content: '복잡한 계약 관련 문제를 명쾌하게 해결해주셨습니다. 법률 전문가의 도움이 이렇게 중요한지 깨달았어요.' }
      },
      {
        expertId: 4, userId: clients[5].id,
        startAt: new Date('2025-09-17T15:00:00Z'),
        endAt: new Date('2025-09-17T16:00:00Z'),
        status: 'CONFIRMED', cost: 55000, note: '개인 자산 관리 상담',
        review: { rating: 4, content: '개인 자산 관리에 대한 실무적인 조언이 정말 도움이 되었습니다. 장기적인 관점에서의 투자 전략을 배웠어요.' }
      },
      {
        expertId: 5, userId: clients[6].id,
        startAt: new Date('2025-09-18T13:00:00Z'),
        endAt: new Date('2025-09-18T14:00:00Z'),
        status: 'CONFIRMED', cost: 48000, note: '건강 습관 개선 상담',
        review: { rating: 5, content: '생활 습관 개선과 건강 관리 방법을 체계적으로 알려주셔서 감사합니다. 바로 실천할 수 있는 내용들이었어요.' }
      },
      {
        expertId: 6, userId: clients[7].id,
        startAt: new Date('2025-09-19T10:00:00Z'),
        endAt: new Date('2025-09-19T11:00:00Z'),
        status: 'CONFIRMED', cost: 45000, note: '진로 고민 상담',
        review: { rating: 4, content: '진로 고민을 해결하는데 큰 도움이 되었습니다. 구체적인 계획과 실행 방안을 제시해주셔서 방향성을 잡을 수 있었어요.' }
      }
    ];

    console.log(`Inserting ${consultationData.length} new consultations with reviews...`);

    for (const data of consultationData) {
      try {
        // 1. 예약 생성
        const displayId = `RES${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        const reservation = await prisma.reservation.create({
          data: {
            displayId,
            userId: data.userId,
            expertId: data.expertId,
            startAt: data.startAt,
            endAt: data.endAt,
            status: data.status,
            cost: data.cost,
            note: data.note
          }
        });

        console.log(`Created reservation: ${reservation.displayId} - ${data.note}`);

        // 2. 리뷰 생성
        const reviewDisplayId = `REV${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        const review = await prisma.review.create({
          data: {
            displayId: reviewDisplayId,
            userId: data.userId,
            expertId: data.expertId,
            reservationId: reservation.id,
            rating: data.review.rating,
            content: data.review.content,
            isPublic: true
          }
        });

        console.log(`Created review: ${review.displayId} - Rating: ${data.review.rating}/5`);

        // 요청 부하를 줄이기 위해 짧은 지연
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`Failed to create consultation for expertId ${data.expertId}:`, error.message);
      }
    }

    console.log('Additional consultation and review data insertion completed!');

    // 최종 통계 확인
    const stats = await Promise.all([
      prisma.reservation.count(),
      prisma.review.count(),
      prisma.reservation.count({ where: { status: 'CONFIRMED' } }),
      prisma.review.groupBy({
        by: ['rating'],
        _count: { rating: true }
      })
    ]);

    console.log(`\nFinal statistics:`);
    console.log(`Total reservations: ${stats[0]}`);
    console.log(`Total reviews: ${stats[1]}`);
    console.log(`Confirmed reservations: ${stats[2]}`);
    console.log(`Rating distribution:`);
    stats[3].forEach(stat => {
      console.log(`  ${stat.rating} stars: ${stat._count.rating} reviews`);
    });

  } catch (error) {
    console.error('Error inserting additional consultation data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertMoreConsultationReviews();