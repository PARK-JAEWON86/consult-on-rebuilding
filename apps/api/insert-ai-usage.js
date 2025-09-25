const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function insertAIUsageData() {
  try {
    // 클라이언트 사용자들 (ID 32-56)에 대한 AI 사용량 데이터
    const aiUsageData = [
      // 클라이언트 사용자들 (ID 32-56)
      { userId: 32, usedTokens: 125, purchasedTokens: 500, totalTurns: 25, totalTokens: 445 },
      { userId: 33, usedTokens: 210, purchasedTokens: 1000, totalTurns: 42, totalTokens: 990 },
      { userId: 34, usedTokens: 89, purchasedTokens: 300, totalTurns: 17, totalTokens: 209 },
      { userId: 35, usedTokens: 156, purchasedTokens: 200, totalTurns: 31, totalTokens: 236 },
      { userId: 36, usedTokens: 234, purchasedTokens: 800, totalTurns: 46, totalTokens: 794 },
      { userId: 37, usedTokens: 178, purchasedTokens: 1500, totalTurns: 35, totalTokens: 1298 },
      { userId: 38, usedTokens: 98, purchasedTokens: 500, totalTurns: 19, totalTokens: 378 },
      { userId: 39, usedTokens: 134, purchasedTokens: 300, totalTurns: 26, totalTokens: 284 },
      { userId: 40, usedTokens: 112, purchasedTokens: 200, totalTurns: 22, totalTokens: 202 },
      { userId: 41, usedTokens: 156, purchasedTokens: 500, totalTurns: 31, totalTokens: 476 },
      { userId: 42, usedTokens: 234, purchasedTokens: 1000, totalTurns: 46, totalTokens: 1014 },
      { userId: 43, usedTokens: 89, purchasedTokens: 300, totalTurns: 17, totalTokens: 209 },
      { userId: 44, usedTokens: 156, purchasedTokens: 200, totalTurns: 31, totalTokens: 236 },
      { userId: 45, usedTokens: 210, purchasedTokens: 800, totalTurns: 42, totalTokens: 770 },
      { userId: 46, usedTokens: 178, purchasedTokens: 1500, totalTurns: 35, totalTokens: 1298 },
      { userId: 47, usedTokens: 98, purchasedTokens: 500, totalTurns: 19, totalTokens: 378 },
      { userId: 48, usedTokens: 134, purchasedTokens: 300, totalTurns: 26, totalTokens: 284 },
      { userId: 49, usedTokens: 112, purchasedTokens: 200, totalTurns: 22, totalTokens: 202 },
      { userId: 50, usedTokens: 156, purchasedTokens: 500, totalTurns: 31, totalTokens: 476 },
      { userId: 51, usedTokens: 234, purchasedTokens: 1000, totalTurns: 46, totalTokens: 1014 },
      { userId: 52, usedTokens: 89, purchasedTokens: 300, totalTurns: 17, totalTokens: 209 },
      { userId: 53, usedTokens: 156, purchasedTokens: 200, totalTurns: 31, totalTokens: 236 },
      { userId: 54, usedTokens: 210, purchasedTokens: 800, totalTurns: 42, totalTokens: 770 },
      { userId: 55, usedTokens: 178, purchasedTokens: 1500, totalTurns: 35, totalTokens: 1298 },
      { userId: 56, usedTokens: 98, purchasedTokens: 500, totalTurns: 19, totalTokens: 378 },
    ];

    console.log('Inserting AI usage data for clients...');

    for (const data of aiUsageData) {
      // 이미 존재하는지 확인
      const existing = await prisma.aIUsage.findUnique({
        where: { userId: data.userId }
      });

      if (!existing) {
        await prisma.aIUsage.create({
          data: {
            userId: data.userId,
            usedTokens: data.usedTokens,
            purchasedTokens: data.purchasedTokens,
            totalTurns: data.totalTurns,
            totalTokens: data.totalTokens,
            monthlyResetDate: new Date('2025-09-01')
          }
        });
        console.log(`Inserted AI usage for user ${data.userId}`);
      } else {
        console.log(`AI usage already exists for user ${data.userId}`);
      }
    }

    // 전문가들 (ID 2-31)에 대한 기본 AI 사용량 추가
    console.log('Adding basic AI usage for experts...');
    for (let userId = 2; userId <= 31; userId++) {
      const existing = await prisma.aIUsage.findUnique({
        where: { userId }
      });

      if (!existing) {
        const randomUsage = Math.floor(Math.random() * 200) + 50; // 50-250 토큰
        const randomTurns = Math.floor(Math.random() * 20) + 5; // 5-25 턴

        await prisma.aIUsage.create({
          data: {
            userId,
            usedTokens: randomUsage,
            purchasedTokens: 0, // 전문가는 무료 사용
            totalTurns: randomTurns,
            totalTokens: randomUsage,
            monthlyResetDate: new Date('2025-09-01')
          }
        });
        console.log(`Inserted AI usage for expert ${userId}`);
      }
    }

    console.log('AI usage data insertion completed!');

    // 최종 확인
    const totalCount = await prisma.aIUsage.count();
    console.log(`Total AI usage records: ${totalCount}`);

  } catch (error) {
    console.error('Error inserting AI usage data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertAIUsageData();