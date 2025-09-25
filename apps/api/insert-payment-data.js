const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function insertPaymentData() {
  try {
    console.log('Creating payment data for reservations and credit purchases...');

    // 기존 확정된 예약들 가져오기
    const confirmedReservations = await prisma.reservation.findMany({
      where: { status: 'CONFIRMED' },
      select: { id: true, userId: true, expertId: true, cost: true, note: true, createdAt: true },
      orderBy: { id: 'asc' }
    });

    console.log(`Found ${confirmedReservations.length} confirmed reservations to create payments for`);

    // 1. 예약에 대한 PaymentIntent 생성
    console.log('Creating PaymentIntents for confirmed reservations...');

    const paymentProviders = ['toss', 'kakao'];
    let paymentCount = 0;

    for (const reservation of confirmedReservations) {
      const provider = paymentProviders[paymentCount % 2]; // 번갈아가며 사용
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
            description: reservation.note || '상담 결제'
          }
        }
      });

      console.log(`Created PaymentIntent: ${paymentIntent.displayId} - ${reservation.cost} KRW for user ${reservation.userId}`);
      paymentCount++;
    }

    // 2. 크레딧 충전용 PaymentIntent 생성
    console.log('Creating PaymentIntents for credit purchases...');

    const creditPurchases = [
      { userId: 32, amount: 50000, credits: 50000, packageType: 'basic', bonus: 0 },
      { userId: 33, amount: 100000, credits: 100000, packageType: 'premium', bonus: 10000 },
      { userId: 34, amount: 30000, credits: 30000, packageType: 'basic', bonus: 0 },
      { userId: 35, amount: 200000, credits: 200000, packageType: 'vip', bonus: 40000 },
      { userId: 36, amount: 75000, credits: 75000, packageType: 'premium', bonus: 7500 },
      { userId: 37, amount: 40000, credits: 40000, packageType: 'basic', bonus: 0 },
      { userId: 38, amount: 150000, credits: 150000, packageType: 'vip', bonus: 30000 },
      { userId: 39, amount: 60000, credits: 60000, packageType: 'premium', bonus: 6000 },
      { userId: 40, amount: 25000, credits: 25000, packageType: 'basic', bonus: 0 },
      { userId: 41, amount: 120000, credits: 120000, packageType: 'premium', bonus: 12000 }
    ];

    for (let i = 0; i < creditPurchases.length; i++) {
      const purchase = creditPurchases[i];
      const provider = paymentProviders[i % 2];
      const displayId = `PAY${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      const providerKey = `TXN_CREDIT_${Date.now()}_${String(i + 1).padStart(3, '0')}`;

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
          amount: purchase.credits + purchase.bonus, // 기본 크레딧 + 보너스
          reason: 'purchase:credit',
          refId: paymentIntent.displayId
        }
      });

      console.log(`Created Credit Purchase: ${paymentIntent.displayId} - ${purchase.amount} KRW (${purchase.credits + purchase.bonus} credits) for user ${purchase.userId}`);
    }

    console.log('Payment data insertion completed!');

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

    console.log(`\\nFinal statistics:`);
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
    console.error('Error inserting payment data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertPaymentData();