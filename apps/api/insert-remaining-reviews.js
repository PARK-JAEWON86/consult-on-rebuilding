const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function insertRemainingReviews() {
  try {
    console.log('Creating remaining review data...');

    // 기존 리뷰가 있는 reservation ID 확인
    const existingReviews = await prisma.review.findMany({
      select: { reservationId: true }
    });
    const reviewedReservationIds = new Set(existingReviews.map(r => r.reservationId));
    console.log(`Already reviewed reservations: ${Array.from(reviewedReservationIds).join(', ')}`);

    // 모든 CONFIRMED 상태의 예약들 가져오기
    const confirmedReservations = await prisma.reservation.findMany({
      where: {
        status: 'CONFIRMED',
        id: { notIn: Array.from(reviewedReservationIds) }
      },
      select: { id: true, userId: true, expertId: true, note: true },
      orderBy: { id: 'asc' }
    });

    console.log(`Found ${confirmedReservations.length} confirmed reservations without reviews`);

    // SQL 파일의 나머지 리뷰 데이터 (expertId와 내용만 참조)
    const reviewTemplates = [
      // 김민지 (expertId: 2) - 심리상담 (이미 삽입된 것 제외하고 추가)

      // 이준호 (expertId: 3) - 법률상담
      { expertId: 3, rating: 5, content: '부동산 계약서 검토를 정말 꼼꼼히 해주셨습니다. 법적 리스크를 자세히 설명해주시고 수정 사항도 명확하게 제시해주셔서 안심하고 계약할 수 있었어요.' },

      // 박서준 (expertId: 4) - 재무상담
      { expertId: 4, rating: 5, content: '은퇴를 대비한 자산관리 계획을 체계적으로 세워주셔서 감사합니다. 생활비 계산부터 투자 전략까지 실용적인 조언이었어요.' },

      // 최유진 (expertId: 5) - 건강상담 (이미 삽입된 것 제외하고 추가)

      // 정민수 (expertId: 6) - 진로상담 (이미 삽입된 것 제외하고 추가)

      // 김태환 (expertId: 7) - IT상담
      { expertId: 7, rating: 5, content: 'React 학습 계획을 단계별로 제시해주셔서 어디서부터 시작해야 할지 알 수 있었습니다. 실전 프로젝트 예시도 도움이 되었어요.' },
      { expertId: 7, rating: 5, content: '데이터베이스 설계에 대한 전문적인 조언이 정말 유용했습니다. 정규화와 성능 최적화를 고려한 설계 방안이 구체적이었어요.' },

      // 이수연 (expertId: 8) - 디자인상담
      { expertId: 8, rating: 5, content: 'UI/UX 디자인 개선 방안이 정말 전문적이었습니다. 사용자 경험을 고려한 디자인 시각이 인상적이었어요. 포트폴리오도 훌륭했어요.' },
      { expertId: 8, rating: 4, content: '브랜드 정체성에 맞는 로고와 디자인 가이드라인을 체계적으로 제시해주셔서 브랜딩 방향을 명확히 할 수 있었습니다.' },

      // 박동훈 (expertId: 9) - 사업상담
      { expertId: 9, rating: 5, content: '사업계획서 작성 방법을 투자자 관점에서 알려주셔서 정말 유용했습니다. 놓치기 쉬운 핵심 요소들을 꼼꼼히 짚어주셨어요.' },
      { expertId: 9, rating: 5, content: '타겟 고객 분석부터 마케팅 채널 전략까지 체계적으로 알려주셔서 마케팅 계획을 구체화할 수 있었습니다. 실무 경험이 풍부하신 것 같아요.' },

      // 김나영 (expertId: 10) - 언어상담
      { expertId: 10, rating: 4, content: '개인 수준에 맞는 영어 회화 학습 계획이 실용적이었습니다. 실전 연습 방법도 구체적으로 알려주셔서 도움이 되었어요.' },
      { expertId: 10, rating: 4, content: '중국어를 처음 배우는데 기초부터 체계적으로 알려주셔서 학습 방향을 잡을 수 있었습니다. 발음 교정도 도움이 되었어요.' },

      // 추가 리뷰들 (남은 예약들에 대해)
      { expertId: 2, rating: 4, content: '감정 조절 방법을 배우면서 일상생활이 많이 편해졌습니다. 전문적이면서도 따뜻한 상담이었어요.' },
      { expertId: 3, rating: 5, content: '복잡한 계약 관련 문제를 명쾌하게 해결해주셨습니다. 법률 전문가의 도움이 이렇게 중요한지 깨달았어요.' },
      { expertId: 4, rating: 4, content: '개인 자산 관리에 대한 실무적인 조언이 정말 도움이 되었습니다. 장기적인 관점에서의 투자 전략을 배웠어요.' },
      { expertId: 5, rating: 5, content: '생활 습관 개선과 건강 관리 방법을 체계적으로 알려주셔서 감사합니다. 바로 실천할 수 있는 내용들이었어요.' },
      { expertId: 6, rating: 4, content: '진로 고민을 해결하는데 큰 도움이 되었습니다. 구체적인 계획과 실행 방안을 제시해주셔서 방향성을 잡을 수 있었어요.' },
      { expertId: 7, rating: 5, content: '프로그래밍 학습 로드맵과 실전 경험을 공유해주셔서 개발자로 성장하는데 도움이 되었습니다.' },
      { expertId: 8, rating: 4, content: '창의적인 디자인 아이디어와 실무 노하우를 알려주셔서 디자인 실력 향상에 도움이 되었어요.' },
      { expertId: 9, rating: 5, content: '창업 과정에서 겪을 수 있는 시행착오를 미리 알려주셔서 효율적인 사업 추진이 가능했습니다.' },
      { expertId: 10, rating: 4, content: '언어 학습의 효과적인 방법론을 알려주셔서 단시간에 실력 향상을 경험할 수 있었습니다.' },
    ];

    console.log(`Available review templates: ${reviewTemplates.length}`);

    let insertedCount = 0;
    for (let i = 0; i < Math.min(confirmedReservations.length, reviewTemplates.length); i++) {
      const reservation = confirmedReservations[i];
      const template = reviewTemplates[i];

      const displayId = `REV${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      try {
        const created = await prisma.review.create({
          data: {
            displayId,
            userId: reservation.userId,
            expertId: reservation.expertId,
            reservationId: reservation.id,
            rating: template.rating,
            content: template.content,
            isPublic: true
          }
        });

        console.log(`Created review: ${created.displayId} - Rating: ${template.rating}/5 (Reservation ${reservation.id})`);
        insertedCount++;
      } catch (error) {
        console.error(`Failed to create review for reservation ${reservation.id}:`, error.message);
      }

      // 요청 부하를 줄이기 위해 짧은 지연
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Successfully inserted ${insertedCount} additional reviews!`);

    // 최종 통계 확인
    const stats = await Promise.all([
      prisma.review.count(),
      prisma.review.groupBy({
        by: ['rating'],
        _count: { rating: true }
      }),
      prisma.reservation.count({ where: { status: 'CONFIRMED' } }),
    ]);

    console.log(`\nFinal statistics:`);
    console.log(`Total reviews: ${stats[0]}`);
    console.log(`Rating distribution:`);
    stats[1].forEach(stat => {
      console.log(`  ${stat.rating} stars: ${stat._count.rating} reviews`);
    });
    console.log(`Confirmed reservations: ${stats[2]}`);

  } catch (error) {
    console.error('Error inserting remaining review data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertRemainingReviews();