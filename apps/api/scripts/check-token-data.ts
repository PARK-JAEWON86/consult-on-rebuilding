import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTokenData() {
  console.log('=== AI 토큰 데이터 현황 조사 ===\n');

  // 1. 전체 사용자 수
  const totalUsers = await prisma.user.count();
  console.log(`📊 전체 사용자 수: ${totalUsers}명`);

  // 2. AIUsage 레코드가 있는 사용자 수
  const usersWithAIUsage = await prisma.aIUsage.count();
  console.log(`✅ AIUsage 레코드 있는 사용자: ${usersWithAIUsage}명`);

  // 3. AIUsage 레코드가 없는 사용자 수
  const usersWithoutAIUsage = totalUsers - usersWithAIUsage;
  console.log(`❌ AIUsage 레코드 없는 사용자: ${usersWithoutAIUsage}명\n`);

  // 4. 토큰 사용 현황 통계
  const stats = await prisma.aIUsage.aggregate({
    _sum: {
      usedTokens: true,
      purchasedTokens: true,
      totalTurns: true,
    },
    _avg: {
      usedTokens: true,
    },
    _max: {
      usedTokens: true,
    },
  });

  console.log('📈 토큰 사용 통계:');
  console.log(`   - 총 사용 토큰: ${stats._sum.usedTokens?.toLocaleString() || 0}`);
  console.log(`   - 총 구매 토큰: ${stats._sum.purchasedTokens?.toLocaleString() || 0}`);
  console.log(`   - 총 채팅 턴 수: ${stats._sum.totalTurns?.toLocaleString() || 0}`);
  console.log(`   - 평균 사용 토큰: ${Math.round(stats._avg.usedTokens || 0).toLocaleString()}`);
  console.log(`   - 최대 사용 토큰: ${stats._max.usedTokens?.toLocaleString() || 0}\n`);

  // 5. AIUsage 레코드가 없는 사용자 목록 (처음 10명)
  const usersNeedInit = await prisma.user.findMany({
    where: {
      aiUsage: null,
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
    take: 10,
    orderBy: { id: 'asc' },
  });

  console.log('🆕 AIUsage 초기화가 필요한 사용자 (처음 10명):');
  if (usersNeedInit.length === 0) {
    console.log('   없음 - 모든 사용자가 이미 초기화됨');
  } else {
    usersNeedInit.forEach((user) => {
      console.log(`   - ID: ${user.id}, Email: ${user.email}, 가입일: ${user.createdAt.toISOString().split('T')[0]}`);
    });
  }
  console.log('');

  // 6. 토큰을 실제 사용한 사용자 (usedTokens > 0)
  const activeUsers = await prisma.aIUsage.findMany({
    where: {
      OR: [
        { usedTokens: { gt: 0 } },
        { purchasedTokens: { gt: 0 } },
      ],
    },
    select: {
      userId: true,
      usedTokens: true,
      purchasedTokens: true,
      totalTurns: true,
      user: {
        select: {
          email: true,
        },
      },
    },
    orderBy: { usedTokens: 'desc' },
    take: 10,
  });

  console.log('🔥 토큰을 실제 사용한 사용자 (상위 10명):');
  if (activeUsers.length === 0) {
    console.log('   없음 - 아직 토큰을 사용한 사용자 없음');
  } else {
    activeUsers.forEach((usage) => {
      const total = 100000 + usage.purchasedTokens;
      const remaining = total - usage.usedTokens;
      const percent = Math.round((usage.usedTokens / total) * 100);

      console.log(`   - ID: ${usage.userId}, Email: ${usage.user.email}`);
      console.log(`     사용: ${usage.usedTokens.toLocaleString()} (${percent}%), 구매: ${usage.purchasedTokens.toLocaleString()}, 턴: ${usage.totalTurns}, 남은: ${remaining.toLocaleString()}`);
    });
  }
  console.log('');

  // 7. 채팅 세션이 있는 사용자
  const usersWithChats = await prisma.chatSession.groupBy({
    by: ['userId'],
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: 5,
  });

  console.log('💬 채팅 세션이 있는 사용자 (상위 5명):');
  if (usersWithChats.length === 0) {
    console.log('   없음 - 아직 채팅한 사용자 없음');
  } else {
    for (const chat of usersWithChats) {
      const user = await prisma.user.findUnique({
        where: { id: chat.userId },
        select: { email: true },
      });
      console.log(`   - ID: ${chat.userId}, Email: ${user?.email}, 세션 수: ${chat._count.id}`);
    }
  }
  console.log('');

  // 8. 요약
  console.log('📋 요약:');
  console.log(`   ✅ 초기화 완료: ${usersWithAIUsage}명`);
  console.log(`   ⚠️  초기화 필요: ${usersWithoutAIUsage}명`);
  console.log(`   🔥 활성 사용자 (토큰 사용): ${activeUsers.length}명`);
  console.log(`   💬 채팅한 사용자: ${usersWithChats.length}명`);

  await prisma.$disconnect();
}

checkTokenData().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
