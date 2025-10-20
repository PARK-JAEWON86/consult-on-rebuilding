import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserCredits() {
  const userId = 143;

  try {
    // 사용자 정보 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      console.error(`❌ 사용자 ID ${userId}를 찾을 수 없습니다.`);
      process.exit(1);
    }

    console.log(`\n📋 사용자 정보:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   이름: ${user.name}`);
    console.log(`   이메일: ${user.email}`);

    // 크레딧 잔액 계산
    const balance = await prisma.creditTransaction.aggregate({
      _sum: { amount: true },
      where: { userId },
    });

    const credits = balance._sum.amount ?? 0;

    console.log(`\n💰 현재 크레딧 잔액: ${credits.toLocaleString()} 크레딧`);

    // 최근 거래 내역
    const recentTransactions = await prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        amount: true,
        reason: true,
        createdAt: true,
      },
    });

    console.log(`\n📊 최근 거래 내역 (최근 10건):`);
    recentTransactions.forEach((tx) => {
      const amountStr = tx.amount > 0 ? `+${tx.amount}` : `${tx.amount}`;
      console.log(
        `   [${tx.createdAt.toLocaleString('ko-KR')}] ${amountStr.padStart(9)} 크레딧 - ${tx.reason}`
      );
    });

    console.log(`\n✅ 프론트엔드에서 /auth/me API 호출 시`);
    console.log(`   반환될 credits 값: ${credits}`);

  } catch (error) {
    console.error('\n❌ 오류 발생:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkUserCredits()
  .then(() => {
    console.log('\n✅ 확인 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 확인 실패:', error);
    process.exit(1);
  });
