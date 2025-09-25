const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function insertSettlementsEnhancedData() {
  try {
    console.log('Inserting settlements enhanced data with 2025 dates...');

    // 현재 데이터 상태 확인
    const currentStats = await Promise.all([
      prisma.reservation.count({ where: { id: { gte: 3000 } } }),
      prisma.review.count({ where: { id: { gte: 200 } } }),
      prisma.session.count({ where: { id: { gte: 200 } } }),
      prisma.creditTransaction.count({ where: { reason: 'consultation:payment' } })
    ]);

    console.log(`Current state:`);
    console.log(`  Reservations (ID >= 3000): ${currentStats[0]}`);
    console.log(`  Reviews (ID >= 200): ${currentStats[1]}`);
    console.log(`  Sessions (ID >= 200): ${currentStats[2]}`);
    console.log(`  Credit transactions (consultation): ${currentStats[3]}`);

    // 1. 전문가 요금 정보 업데이트 (상위 6명만)
    console.log('\n1. Updating expert rates for top 6 experts...');

    const expertUpdates = [
      { sqlId: 1, dbId: 2, ratePerMin: 1500, hourlyRate: 90000 },   // 김민지 (심리상담)
      { sqlId: 2, dbId: 3, ratePerMin: 1800, hourlyRate: 108000 },  // 이준호 (심리상담)
      { sqlId: 3, dbId: 4, ratePerMin: 2500, hourlyRate: 150000 },  // 박서준 (법률상담)
      { sqlId: 4, dbId: 5, ratePerMin: 2200, hourlyRate: 132000 },  // 최유진 (법률상담)
      { sqlId: 5, dbId: 6, ratePerMin: 2000, hourlyRate: 120000 },  // 정민수 (재무상담)
      { sqlId: 6, dbId: 7, ratePerMin: 2700, hourlyRate: 162000 }   // 강태현 (IT상담)
    ];

    for (const update of expertUpdates) {
      try {
        const updatedExpert = await prisma.expert.update({
          where: { id: update.dbId },
          data: {
            ratePerMin: update.ratePerMin,
            hourlyRate: update.hourlyRate,
            totalSessions: { increment: 25 },
            reviewCount: { increment: 10 }
          }
        });
        console.log(`  Updated expert ${update.dbId}: ${updatedExpert.name} -> ${update.ratePerMin}/min`);
      } catch (error) {
        console.error(`Failed to update expert ${update.dbId}:`, error.message);
      }
    }

    // 2. 2025년 상담 예약 데이터 생성 (49개)
    console.log('\n2. Creating 2025 consultation reservations...');

    const reservationData = [
      // 김민지 심리상담사 (expertId: 2, 1500원/분)
      { id: 3001, displayId: 'RES_2025_KM_001', userId: 32, expertId: 2, startAt: '2025-01-15 14:00:00', endAt: '2025-01-15 15:00:00', cost: 90000, note: '스트레스 관리에 대한 상담', createdAt: '2025-01-15 10:00:00' },
      { id: 3002, displayId: 'RES_2025_KM_002', userId: 33, expertId: 2, startAt: '2025-01-22 16:00:00', endAt: '2025-01-22 17:30:00', cost: 135000, note: '심화 상담 진행', createdAt: '2025-01-22 12:00:00' },
      { id: 3003, displayId: 'RES_2025_KM_003', userId: 34, expertId: 2, startAt: '2025-02-05 10:00:00', endAt: '2025-02-05 11:00:00', cost: 90000, note: '스트레스 관리 상담', createdAt: '2025-02-05 08:00:00' },
      { id: 3004, displayId: 'RES_2025_KM_004', userId: 35, expertId: 2, startAt: '2025-02-18 15:00:00', endAt: '2025-02-18 16:30:00', cost: 135000, note: '심화 심리 상담', createdAt: '2025-02-18 11:00:00' },
      { id: 3005, displayId: 'RES_2025_KM_005', userId: 36, expertId: 2, startAt: '2025-03-10 14:00:00', endAt: '2025-03-10 15:00:00', cost: 90000, note: '스트레스 관리 상담', createdAt: '2025-03-10 10:00:00' },

      // 박서준 변호사 (expertId: 4, 2500원/분)
      { id: 3006, displayId: 'RES_2025_PC_001', userId: 32, expertId: 4, startAt: '2025-01-12 10:00:00', endAt: '2025-01-12 12:00:00', cost: 300000, note: '계약서 검토 및 법률 자문', createdAt: '2025-01-12 08:00:00' },
      { id: 3007, displayId: 'RES_2025_PC_002', userId: 33, expertId: 4, startAt: '2025-01-28 14:00:00', endAt: '2025-01-28 15:00:00', cost: 150000, note: '법률 상담', createdAt: '2025-01-28 12:00:00' },
      { id: 3008, displayId: 'RES_2025_PC_003', userId: 34, expertId: 4, startAt: '2025-02-15 09:00:00', endAt: '2025-02-15 11:00:00', cost: 300000, note: '계약 관련 법률 자문', createdAt: '2025-02-15 07:00:00' },

      // 정민수 재무설계사 (expertId: 6, 2000원/분)
      { id: 3009, displayId: 'RES_2025_YT_001', userId: 33, expertId: 6, startAt: '2025-01-10 15:00:00', endAt: '2025-01-10 16:30:00', cost: 180000, note: '개인 재무 분석', createdAt: '2025-01-10 13:00:00' },
      { id: 3010, displayId: 'RES_2025_YT_002', userId: 34, expertId: 6, startAt: '2025-02-08 10:00:00', endAt: '2025-02-08 12:00:00', cost: 240000, note: '투자 포트폴리오 상담', createdAt: '2025-02-08 08:00:00' },
      { id: 3011, displayId: 'RES_2025_YT_003', userId: 35, expertId: 6, startAt: '2025-02-25 14:00:00', endAt: '2025-02-25 15:00:00', cost: 120000, note: '재무 상담', createdAt: '2025-02-25 12:00:00' },

      // 이준호 상담심리사 (expertId: 3, 1800원/분)
      { id: 3012, displayId: 'RES_2025_LY_001', userId: 42, expertId: 3, startAt: '2025-01-18 16:00:00', endAt: '2025-01-18 17:00:00', cost: 108000, note: '심리 상담', createdAt: '2025-01-18 14:00:00' },
      { id: 3013, displayId: 'RES_2025_LY_002', userId: 43, expertId: 3, startAt: '2025-02-12 10:00:00', endAt: '2025-02-12 11:30:00', cost: 162000, note: '심화 심리 상담', createdAt: '2025-02-12 08:00:00' },

      // 최유진 변호사 (expertId: 5, 2200원/분)
      { id: 3014, displayId: 'RES_2025_CE_001', userId: 48, expertId: 5, startAt: '2025-01-25 11:00:00', endAt: '2025-01-25 12:00:00', cost: 132000, note: '개인법무 상담', createdAt: '2025-01-25 09:00:00' },
      { id: 3015, displayId: 'RES_2025_CE_002', userId: 49, expertId: 5, startAt: '2025-02-20 14:00:00', endAt: '2025-02-20 15:30:00', cost: 198000, note: '법률 자문', createdAt: '2025-02-20 12:00:00' },

      // 강태현 IT상담 전문가 (expertId: 7, 2700원/분)
      { id: 3016, displayId: 'RES_2025_IT_001', userId: 53, expertId: 7, startAt: '2025-01-20 14:00:00', endAt: '2025-01-20 16:00:00', cost: 324000, note: 'IT 프로젝트 상담', createdAt: '2025-01-20 12:00:00' },
      { id: 3017, displayId: 'RES_2025_IT_002', userId: 54, expertId: 7, startAt: '2025-02-28 10:00:00', endAt: '2025-02-28 11:30:00', cost: 243000, note: '시스템 아키텍처 상담', createdAt: '2025-02-28 08:00:00' },

      // 추가 전문가들 (expertId: 8-13)
      { id: 3018, displayId: 'RES_2025_EX8_001', userId: 32, expertId: 8, startAt: '2025-03-12 14:00:00', endAt: '2025-03-12 15:30:00', cost: 171000, note: '재무 상담', createdAt: '2025-03-12 12:00:00' },
      { id: 3019, displayId: 'RES_2025_EX9_001', userId: 33, expertId: 9, startAt: '2025-04-08 16:00:00', endAt: '2025-04-08 17:00:00', cost: 151200, note: '투자 상담', createdAt: '2025-04-08 14:00:00' },
      { id: 3020, displayId: 'RES_2025_EX10_001', userId: 34, expertId: 10, startAt: '2025-05-05 10:00:00', endAt: '2025-05-05 11:30:00', cost: 172800, note: '건강 상담', createdAt: '2025-05-05 08:00:00' }
    ];

    let reservationsInserted = 0;
    for (const reservation of reservationData) {
      try {
        // 중복 확인
        const existing = await prisma.reservation.findUnique({
          where: { id: reservation.id }
        });

        if (existing) {
          console.log(`  Reservation ${reservation.id} already exists, skipping...`);
          continue;
        }

        await prisma.reservation.create({
          data: {
            id: reservation.id,
            displayId: reservation.displayId,
            userId: reservation.userId,
            expertId: reservation.expertId,
            startAt: new Date(reservation.startAt),
            endAt: new Date(reservation.endAt),
            status: 'CONFIRMED',
            cost: reservation.cost,
            note: reservation.note,
            createdAt: new Date(reservation.createdAt),
            updatedAt: new Date(reservation.endAt)
          }
        });

        reservationsInserted++;
        console.log(`  Created reservation ${reservation.id}: ${reservation.displayId} (₩${reservation.cost.toLocaleString()})`);

      } catch (error) {
        console.error(`Failed to create reservation ${reservation.id}:`, error.message);
      }
    }

    // 3. 크레딧 거래 내역 (고객 결제 + 전문가 수익)
    console.log('\n3. Creating credit transactions...');

    const creditTransactions = [];

    // 고객 결제 (음수)
    for (const reservation of reservationData) {
      creditTransactions.push({
        userId: reservation.userId,
        amount: -reservation.cost,
        reason: 'consultation:payment',
        refId: reservation.displayId,
        createdAt: reservation.createdAt
      });
    }

    // 전문가 수익 (12% 수수료 차감, 양수)
    for (const reservation of reservationData) {
      const netAmount = Math.round(reservation.cost * 0.88);
      creditTransactions.push({
        userId: reservation.expertId, // 전문가의 user ID는 expert ID와 동일
        amount: netAmount,
        reason: 'consultation:completed',
        refId: reservation.displayId,
        createdAt: reservation.endAt
      });
    }

    let transactionsInserted = 0;
    for (const transaction of creditTransactions) {
      try {
        // 중복 확인
        const existing = await prisma.creditTransaction.findFirst({
          where: {
            userId: transaction.userId,
            reason: transaction.reason,
            refId: transaction.refId
          }
        });

        if (existing) {
          console.log(`  Transaction already exists for user ${transaction.userId}, refId ${transaction.refId}, skipping...`);
          continue;
        }

        await prisma.creditTransaction.create({
          data: {
            userId: transaction.userId,
            amount: transaction.amount,
            reason: transaction.reason,
            refId: transaction.refId,
            createdAt: new Date(transaction.createdAt)
          }
        });

        transactionsInserted++;
        const type = transaction.amount > 0 ? 'earned' : 'spent';
        console.log(`  Transaction: User ${transaction.userId} ${type} ₩${Math.abs(transaction.amount).toLocaleString()}`);

      } catch (error) {
        console.error(`Failed to create transaction:`, error.message);
      }
    }

    // 4. 리뷰 데이터 추가
    console.log('\n4. Creating reviews...');

    const reviewData = [
      { id: 201, displayId: 'REV_KM_001_2025', userId: 32, expertId: 2, reservationId: 3001, rating: 5, content: '김민지 선생님의 상담이 정말 도움이 되었습니다. 마음이 편해졌어요.' },
      { id: 202, displayId: 'REV_KM_002_2025', userId: 33, expertId: 2, reservationId: 3002, rating: 4, content: '전문적이고 친절한 상담이었습니다.' },
      { id: 203, displayId: 'REV_PC_001_2025', userId: 32, expertId: 4, reservationId: 3006, rating: 5, content: '박서준 변호사님의 법률 자문이 명확하고 정확했습니다.' },
      { id: 204, displayId: 'REV_YT_001_2025', userId: 33, expertId: 6, reservationId: 3009, rating: 4, content: '정민수 선생님의 재무 상담이 유익했습니다.' },
      { id: 205, displayId: 'REV_LY_001_2025', userId: 42, expertId: 3, reservationId: 3012, rating: 5, content: '이준호 선생님의 상담이 정말 따뜻하고 도움이 되었습니다.' },
      { id: 206, displayId: 'REV_CE_001_2025', userId: 48, expertId: 5, reservationId: 3014, rating: 4, content: '최유진 변호사님의 개인법무 상담이 정확했습니다.' }
    ];

    let reviewsInserted = 0;
    for (const review of reviewData) {
      try {
        const existing = await prisma.review.findUnique({
          where: { id: review.id }
        });

        if (existing) {
          console.log(`  Review ${review.id} already exists, skipping...`);
          continue;
        }

        await prisma.review.create({
          data: {
            id: review.id,
            displayId: review.displayId,
            userId: review.userId,
            expertId: review.expertId,
            reservationId: review.reservationId,
            rating: review.rating,
            content: review.content,
            isPublic: true
          }
        });

        reviewsInserted++;
        console.log(`  Created review ${review.id}: ${review.rating}★ from user ${review.userId}`);

      } catch (error) {
        console.error(`Failed to create review ${review.id}:`, error.message);
      }
    }

    // 5. 세션 기록 데이터
    console.log('\n5. Creating session records...');

    const sessionData = [
      { id: 201, displayId: 'SES_KM_001_2025', reservationId: 3001, startedAt: '2025-01-15 14:00:00', endedAt: '2025-01-15 15:00:00', duration: 60, notes: '스트레스 관리 상담 완료' },
      { id: 202, displayId: 'SES_KM_002_2025', reservationId: 3002, startedAt: '2025-01-22 16:00:00', endedAt: '2025-01-22 17:30:00', duration: 90, notes: '심화 상담 진행' },
      { id: 203, displayId: 'SES_PC_001_2025', reservationId: 3006, startedAt: '2025-01-12 10:00:00', endedAt: '2025-01-12 12:00:00', duration: 120, notes: '계약서 검토 및 법률 자문' },
      { id: 204, displayId: 'SES_YT_001_2025', reservationId: 3009, startedAt: '2025-01-10 15:00:00', endedAt: '2025-01-10 16:30:00', duration: 90, notes: '개인 재무 분석 및 투자 상담' }
    ];

    let sessionsInserted = 0;
    for (const session of sessionData) {
      try {
        const existing = await prisma.session.findUnique({
          where: { id: session.id }
        });

        if (existing) {
          console.log(`  Session ${session.id} already exists, skipping...`);
          continue;
        }

        await prisma.session.create({
          data: {
            id: session.id,
            displayId: session.displayId,
            reservationId: session.reservationId,
            status: 'ENDED',
            startedAt: new Date(session.startedAt),
            endedAt: new Date(session.endedAt),
            duration: session.duration
          }
        });

        sessionsInserted++;
        console.log(`  Created session ${session.id}: ${session.displayId} (${session.duration} min)`);

      } catch (error) {
        console.error(`Failed to create session ${session.id}:`, error.message);
      }
    }

    // 최종 통계
    console.log('\n=== Settlement Data Insertion Summary ===');
    console.log(`Reservations inserted: ${reservationsInserted}`);
    console.log(`Credit transactions inserted: ${transactionsInserted}`);
    console.log(`Reviews inserted: ${reviewsInserted}`);
    console.log(`Sessions inserted: ${sessionsInserted}`);

    // 정산 검증 쿼리
    console.log('\n6. Settlement verification...');

    const verificationData = await prisma.reservation.findMany({
      where: { id: { gte: 3000 } },
      include: {
        _count: true
      }
    });

    const totalRevenue = verificationData.reduce((sum, res) => sum + res.cost, 0);
    const platformFee = Math.round(totalRevenue * 0.12);
    const expertRevenue = Math.round(totalRevenue * 0.88);

    console.log(`\nSettlement Summary:`);
    console.log(`  Total consultations: ${verificationData.length}`);
    console.log(`  Gross revenue: ₩${totalRevenue.toLocaleString()}`);
    console.log(`  Platform fee (12%): ₩${platformFee.toLocaleString()}`);
    console.log(`  Expert revenue (88%): ₩${expertRevenue.toLocaleString()}`);

  } catch (error) {
    console.error('Error inserting settlements enhanced data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertSettlementsEnhancedData();