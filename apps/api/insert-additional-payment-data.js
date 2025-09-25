const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function insertAdditionalPaymentData() {
  try {
    console.log('Creating additional payment data based on confirmed reservations...');

    // 모든 기존 PaymentIntent 확인
    const existingPayments = await prisma.paymentIntent.findMany({
      select: {
        metadata: true,
        displayId: true
      }
    });

    const existingReservationIds = new Set();
    existingPayments.forEach(payment => {
      if (payment.metadata && typeof payment.metadata === 'object') {
        const metadata = payment.metadata;
        if (metadata.reservationId) {
          existingReservationIds.add(metadata.reservationId);
        }
      }
    });

    console.log(`Found ${existingReservationIds.size} existing consultation payments`);

    // 결제가 없는 확정된 예약들 가져오기
    const unpaidReservations = await prisma.reservation.findMany({
      where: {
        status: 'CONFIRMED',
        id: { notIn: Array.from(existingReservationIds) }
      },
      select: {
        id: true,
        userId: true,
        expertId: true,
        cost: true,
        note: true,
        createdAt: true
      },
      orderBy: { id: 'asc' }
    });

    console.log(`Found ${unpaidReservations.length} confirmed reservations without payments`);

    const paymentProviders = ['toss', 'kakao'];
    let paymentCount = existingPayments.length;

    // 1. 상담 결제 데이터 생성
    for (const reservation of unpaidReservations) {
      const provider = paymentProviders[paymentCount % 2];
      const displayId = `PAY${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      const providerKey = `TXN_${new Date(reservation.createdAt).getFullYear()}${(new Date(reservation.createdAt).getMonth() + 1).toString().padStart(2, '0')}${new Date(reservation.createdAt).getDate().toString().padStart(2, '0')}_${String(paymentCount + 1).padStart(3, '0')}`;

      const paymentIntent = await prisma.paymentIntent.create({
        data: {
          displayId,
          userId: reservation.userId,
          amount: reservation.cost,
          currency: 'KRW',
          status: 'SUCCEEDED',
          provider,
          providerKey,
          metadata: {
            reservationId: reservation.id,
            expertId: reservation.expertId,
            paymentType: 'consultation',
            description: reservation.note || '상담 결제',
            consultationType: Math.random() > 0.5 ? 'video' : 'chat',
            duration: Math.floor(Math.random() * 60) + 30, // 30-90분
          }
        }
      });

      console.log(`Created PaymentIntent: ${paymentIntent.displayId} - ${reservation.cost} KRW for reservation ${reservation.id}`);
      paymentCount++;

      // 요청 부하를 줄이기 위해 짧은 지연
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 2. 추가 크레딧 구매 결제 데이터 생성
    console.log('Creating additional credit purchase payments...');

    // 사용자들 가져오기
    const allUsers = await prisma.user.findMany({
      select: { id: true, name: true, roles: true }
    });

    const clients = allUsers.filter(user => {
      const roles = JSON.parse(user.roles);
      return roles.includes('USER');
    }).slice(0, 20);

    const additionalCreditPurchases = [
      { userId: clients[0]?.id || 32, amount: 80000, credits: 80000, packageType: 'premium', bonus: 8000 },
      { userId: clients[1]?.id || 33, amount: 45000, credits: 45000, packageType: 'basic', bonus: 0 },
      { userId: clients[2]?.id || 34, amount: 150000, credits: 150000, packageType: 'vip', bonus: 30000 },
      { userId: clients[3]?.id || 35, amount: 60000, credits: 60000, packageType: 'premium', bonus: 6000 },
      { userId: clients[4]?.id || 36, amount: 35000, credits: 35000, packageType: 'basic', bonus: 0 },
      { userId: clients[5]?.id || 37, amount: 180000, credits: 180000, packageType: 'vip', bonus: 36000 },
      { userId: clients[6]?.id || 38, amount: 90000, credits: 90000, packageType: 'premium', bonus: 9000 },
      { userId: clients[7]?.id || 39, amount: 55000, credits: 55000, packageType: 'premium', bonus: 5500 },
      { userId: clients[8]?.id || 40, amount: 30000, credits: 30000, packageType: 'basic', bonus: 0 },
      { userId: clients[9]?.id || 41, amount: 110000, credits: 110000, packageType: 'premium', bonus: 11000 },
    ];

    for (let i = 0; i < additionalCreditPurchases.length; i++) {
      const purchase = additionalCreditPurchases[i];
      const provider = paymentProviders[i % 2];
      const displayId = `PAY${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      const providerKey = `TXN_CREDIT_${Date.now()}_${String(paymentCount + i + 1).padStart(3, '0')}`;

      // PaymentIntent 생성
      const paymentIntent = await prisma.paymentIntent.create({
        data: {
          displayId,
          userId: purchase.userId,
          amount: purchase.amount,
          currency: 'KRW',
          status: 'SUCCEEDED',
          provider,
          providerKey,
          metadata: {
            paymentType: 'credit_purchase',
            credits: purchase.credits,
            packageType: purchase.packageType,
            bonus: purchase.bonus,
            description: `크레딧 ${purchase.amount.toLocaleString()}원 충전`
          }
        }
      });

      // 크레딧 트랜잭션도 생성 (충전)
      await prisma.creditTransaction.create({
        data: {
          userId: purchase.userId,
          amount: purchase.credits + purchase.bonus,
          reason: 'purchase:credit',
          refId: paymentIntent.displayId
        }
      });

      console.log(`Created Credit Purchase: ${paymentIntent.displayId} - ${purchase.amount} KRW (${purchase.credits + purchase.bonus} credits) for user ${purchase.userId}`);

      // 요청 부하를 줄이기 위해 짧은 지연
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    console.log('Additional payment data insertion completed!');

    // 최종 통계 확인
    const stats = await Promise.all([
      prisma.paymentIntent.count(),
      prisma.paymentIntent.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      prisma.paymentIntent.groupBy({
        by: ['provider'],
        _count: { provider: true }
      }),
      prisma.paymentIntent.aggregate({
        _sum: { amount: true }
      }),
      prisma.creditTransaction.count({ where: { reason: 'purchase:credit' } })
    ]);

    console.log(`\nFinal statistics:`);
    console.log(`Total PaymentIntents: ${stats[0]}`);
    console.log(`Status distribution:`);
    stats[1].forEach(stat => {
      console.log(`  ${stat.status}: ${stat._count.status} payments`);
    });
    console.log(`Provider distribution:`);
    stats[2].forEach(stat => {
      console.log(`  ${stat.provider}: ${stat._count.provider} payments`);
    });
    console.log(`Total payment amount: ${stats[3]._sum.amount?.toLocaleString()} KRW`);
    console.log(`Credit purchase transactions: ${stats[4]}`);

  } catch (error) {
    console.error('Error inserting additional payment data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertAdditionalPaymentData();