import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function restoreCredits() {
  const userId = 143;

  try {
    console.log(`\n📋 사용자 ID ${userId} 크레딧 복구 시작...\n`);

    // 현재 잔액 확인
    const currentBalance = await prisma.creditTransaction.aggregate({
      _sum: { amount: true },
      where: { userId },
    });
    const balanceBefore = currentBalance._sum.amount ?? 0;
    console.log(`💰 복구 전 잔액: ${balanceBefore.toLocaleString()} 크레딧\n`);

    // 잘못 차감된 AI 상담 크레딧 거래 조회
    const wrongTransactions = await prisma.creditTransaction.findMany({
      where: {
        userId,
        reason: {
          contains: 'AI 상담 턴 사용'
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (wrongTransactions.length === 0) {
      console.log('✅ 복구할 거래 내역이 없습니다.');
      return;
    }

    console.log(`🔍 발견된 잘못된 차감 내역 (${wrongTransactions.length}건):`);
    let totalToRestore = 0;
    wrongTransactions.forEach((tx) => {
      console.log(`   [${tx.createdAt.toLocaleString('ko-KR')}] ${tx.amount} 크레딧 - ${tx.reason}`);
      totalToRestore += Math.abs(tx.amount);
    });

    console.log(`\n💡 복구할 총 크레딧: ${totalToRestore.toLocaleString()} 크레딧\n`);

    // 크레딧 복구
    if (totalToRestore > 0) {
      await prisma.creditTransaction.create({
        data: {
          userId,
          amount: totalToRestore,
          reason: 'AI 상담 잘못 차감된 크레딧 복구 (AI 채팅은 토큰만 사용)',
          refId: `CREDIT_RESTORE_${Date.now()}`
        }
      });

      console.log(`✅ 크레딧 복구 완료!`);
      console.log(`   복구 금액: +${totalToRestore.toLocaleString()} 크레딧\n`);
    }

    // 복구 후 잔액 확인
    const newBalance = await prisma.creditTransaction.aggregate({
      _sum: { amount: true },
      where: { userId },
    });
    const balanceAfter = newBalance._sum.amount ?? 0;

    console.log(`📊 크레딧 변동:`);
    console.log(`   복구 전: ${balanceBefore.toLocaleString()} 크레딧`);
    console.log(`   복구 후: ${balanceAfter.toLocaleString()} 크레딧`);
    console.log(`   차이: +${(balanceAfter - balanceBefore).toLocaleString()} 크레딧\n`);

    // 최근 거래 내역
    const recentTransactions = await prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        amount: true,
        reason: true,
        createdAt: true,
      },
    });

    console.log(`📝 최근 거래 내역 (최근 5건):`);
    recentTransactions.forEach((tx) => {
      const amountStr = tx.amount > 0 ? `+${tx.amount}` : `${tx.amount}`;
      console.log(
        `   [${tx.createdAt.toLocaleString('ko-KR')}] ${amountStr.padStart(9)} 크레딧 - ${tx.reason}`
      );
    });

  } catch (error) {
    console.error('\n❌ 오류 발생:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

restoreCredits()
  .then(() => {
    console.log('\n✅ 복구 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 복구 실패:', error);
    process.exit(1);
  });
