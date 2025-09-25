const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAIUsageData() {
  try {
    const count = await prisma.aIUsage.count();
    console.log('AI Usage count:', count);

    if (count > 0) {
      const samples = await prisma.aIUsage.findMany({
        take: 5,
        select: {
          id: true,
          userId: true,
          usedTokens: true,
          purchasedTokens: true,
          totalTurns: true,
          totalTokens: true,
          monthlyResetDate: true
        }
      });
      console.log('Sample AI usage data:');
      samples.forEach((usage, i) => {
        console.log(`${i+1}.`, JSON.stringify(usage, null, 2));
      });
    } else {
      console.log('No AI usage data found. Need to insert data.');
    }

    // 데이터 일관성 확인 - userId가 User 테이블과 매칭되는지 확인
    const userCount = await prisma.user.count();
    console.log('Total users:', userCount);

    if (count > 0) {
      const usageUserIds = await prisma.aIUsage.findMany({
        select: { userId: true },
        distinct: ['userId']
      });
      console.log('Unique user IDs in AI usage:', usageUserIds.length);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAIUsageData();