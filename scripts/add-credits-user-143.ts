import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addCreditsToUser() {
  const userId = 143;
  const correctAmount = 9200; // 스탠다드 플랜 충전 크레딧
  const wrongAmount = 9200; // 이전에 잘못 충전된 금액
  const adjustmentAmount = -wrongAmount; // 차감할 금액
  const reason = 'Standard Plan Credit Charge (80,000원 결제)';
  const adjustmentReason = '잘못 충전된 크레딧 차감';
  const refId = `MANUAL_CHARGE_${Date.now()}`;
  const adjustmentRefId = `ADJUSTMENT_${Date.now()}`;

  try {
    // 사용자 확인
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

    // 현재 잔액 확인
    const currentBalance = await prisma.creditTransaction.aggregate({
      _sum: { amount: true },
      where: { userId },
    });

    const balanceBefore = currentBalance._sum.amount ?? 0;
    console.log(`\n💰 현재 크레딧 잔액: ${balanceBefore.toLocaleString()} 크레딧`);

    // 잘못 충전된 크레딧 차감
    console.log(`\n🔄 잘못 충전된 크레딧 차감 중...`);
    await prisma.creditTransaction.create({
      data: {
        userId,
        amount: adjustmentAmount,
        reason: adjustmentReason,
        refId: adjustmentRefId,
      },
    });
    console.log(`   ✅ ${Math.abs(adjustmentAmount).toLocaleString()} 크레딧 차감 완료`);

    // 올바른 크레딧 충전
    console.log(`\n✨ 올바른 크레딧 충전 중...`);
    await prisma.creditTransaction.create({
      data: {
        userId,
        amount: correctAmount,
        reason,
        refId,
      },
    });

    console.log(`\n✅ 크레딧 충전 완료!`);
    console.log(`   🔴 차감: ${Math.abs(adjustmentAmount).toLocaleString()} 크레딧`);
    console.log(`   🟢 충전: ${correctAmount.toLocaleString()} 크레딧`);
    console.log(`   📊 순 변동: ${(correctAmount + adjustmentAmount).toLocaleString()} 크레딧`);
    console.log(`   💰 최종 잔액: ${(balanceBefore + correctAmount + adjustmentAmount).toLocaleString()} 크레딧`);

    // 충전 후 잔액 확인
    const newBalance = await prisma.creditTransaction.aggregate({
      _sum: { amount: true },
      where: { userId },
    });

    console.log(`\n🔍 최종 확인 잔액: ${(newBalance._sum.amount ?? 0).toLocaleString()} 크레딧`);

    // 최근 거래 내역 출력
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
  } catch (error) {
    console.error('\n❌ 오류 발생:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addCreditsToUser()
  .then(() => {
    console.log('\n✅ 작업 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 작업 실패:', error);
    process.exit(1);
  });
