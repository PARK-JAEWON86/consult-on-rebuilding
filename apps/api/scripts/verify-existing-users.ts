import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 기존 사용자 데이터 검증 스크립트
 *
 * 목적:
 * - 토큰을 구매하거나 AI 채팅을 사용한 사용자의 데이터가 올바른지 확인
 * - 데이터 무결성 검증
 */
async function verifyExistingUsers() {
  console.log('🔍 기존 사용자 데이터 검증 시작...\n');

  // 1. 토큰을 실제 사용한 사용자
  const usersWithUsage = await prisma.aIUsage.findMany({
    where: {
      usedTokens: { gt: 0 },
    },
    include: {
      user: {
        select: {
          email: true,
          createdAt: true,
        },
      },
    },
    orderBy: { usedTokens: 'desc' },
  });

  console.log(`📊 토큰을 사용한 사용자: ${usersWithUsage.length}명\n`);

  if (usersWithUsage.length > 0) {
    console.log('='.repeat(80));
    console.log('🔥 토큰 사용 내역 (상세):');
    console.log('='.repeat(80));

    for (const usage of usersWithUsage) {
      const totalAvailable = 100000 + usage.purchasedTokens;
      const remaining = totalAvailable - usage.usedTokens;
      const usagePercent = Math.round((usage.usedTokens / totalAvailable) * 100);
      const avgPerTurn = usage.totalTurns > 0
        ? Math.round(usage.totalTokens / usage.totalTurns)
        : 0;

      console.log(`\n👤 사용자 ID: ${usage.userId}`);
      console.log(`   Email: ${usage.user.email}`);
      console.log(`   가입일: ${usage.user.createdAt.toISOString().split('T')[0]}`);
      console.log(`   ---`);
      console.log(`   💰 무료 토큰: 100,000`);
      console.log(`   💳 구매 토큰: ${usage.purchasedTokens.toLocaleString()}`);
      console.log(`   📊 총 가용: ${totalAvailable.toLocaleString()}`);
      console.log(`   ---`);
      console.log(`   ✅ 사용한 토큰: ${usage.usedTokens.toLocaleString()} (${usagePercent}%)`);
      console.log(`   💚 남은 토큰: ${remaining.toLocaleString()} (${100 - usagePercent}%)`);
      console.log(`   ---`);
      console.log(`   🔄 총 채팅 턴: ${usage.totalTurns}턴`);
      console.log(`   📈 총 토큰 소비: ${usage.totalTokens.toLocaleString()}`);
      console.log(`   📊 평균 토큰/턴: ${avgPerTurn.toLocaleString()}`);
      console.log(`   📅 월간 리셋일: ${usage.monthlyResetDate.toISOString().split('T')[0]}`);

      // 상태 체크
      let status = '🟢 정상';
      if (usagePercent >= 95) {
        status = '🔴 긴급 (95% 이상)';
      } else if (usagePercent >= 90) {
        status = '🟠 경고 (90% 이상)';
      } else if (usagePercent >= 80) {
        status = '🟡 주의 (80% 이상)';
      }
      console.log(`   상태: ${status}`);
    }

    console.log('\n' + '='.repeat(80));
  }

  // 2. 토큰을 구매한 사용자
  const usersWithPurchase = await prisma.aIUsage.findMany({
    where: {
      purchasedTokens: { gt: 0 },
    },
    include: {
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  console.log(`\n💳 토큰을 구매한 사용자: ${usersWithPurchase.length}명`);

  if (usersWithPurchase.length > 0) {
    for (const usage of usersWithPurchase) {
      console.log(`   - ID: ${usage.userId}, Email: ${usage.user.email}, 구매량: ${usage.purchasedTokens.toLocaleString()}`);
    }
  }

  // 3. 채팅 세션 데이터 검증
  console.log('\n💬 채팅 세션 데이터 검증...');

  const chatSessions = await prisma.chatSession.findMany({
    select: {
      userId: true,
      id: true,
      totalTokens: true,
      createdAt: true,
      _count: {
        select: {
          messages: true,
        },
      },
    },
    orderBy: { totalTokens: 'desc' },
    take: 10,
  });

  console.log(`   총 채팅 세션: ${chatSessions.length}개\n`);

  if (chatSessions.length > 0) {
    console.log('   상위 10개 세션:');
    for (const session of chatSessions) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { email: true },
      });

      console.log(`   - 사용자: ${user?.email}, 토큰: ${session.totalTokens.toLocaleString()}, 메시지: ${session._count.messages}개`);
    }
  }

  // 4. 데이터 무결성 검증
  console.log('\n🔍 데이터 무결성 검증...\n');

  let issuesFound = 0;

  // 4-1. 채팅은 했는데 AIUsage가 없는 사용자
  const usersWithChatButNoUsage = await prisma.user.findMany({
    where: {
      chatSessions: {
        some: {},
      },
      aiUsage: null,
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (usersWithChatButNoUsage.length > 0) {
    console.log(`   ⚠️  채팅 세션은 있으나 AIUsage 없음: ${usersWithChatButNoUsage.length}명`);
    usersWithChatButNoUsage.forEach((user) => {
      console.log(`      - ID: ${user.id}, Email: ${user.email}`);
    });
    issuesFound += usersWithChatButNoUsage.length;
  } else {
    console.log('   ✅ 채팅 사용자 AIUsage 정합성: 정상');
  }

  // 4-2. usedTokens와 totalTokens 불일치
  const inconsistentUsage = await prisma.aIUsage.findMany({
    where: {
      usedTokens: { gt: 0 },
      totalTokens: 0,
    },
    select: {
      userId: true,
      usedTokens: true,
      totalTokens: true,
    },
  });

  if (inconsistentUsage.length > 0) {
    console.log(`\n   ⚠️  usedTokens와 totalTokens 불일치: ${inconsistentUsage.length}명`);
    inconsistentUsage.forEach((usage) => {
      console.log(`      - ID: ${usage.userId}, usedTokens: ${usage.usedTokens}, totalTokens: ${usage.totalTokens}`);
    });
    issuesFound += inconsistentUsage.length;
  } else {
    console.log('   ✅ usedTokens/totalTokens 일관성: 정상');
  }

  // 5. 요약
  console.log('\n' + '='.repeat(80));
  console.log('📋 검증 요약');
  console.log('='.repeat(80));
  console.log(`✅ 토큰 사용 중인 사용자: ${usersWithUsage.length}명`);
  console.log(`💳 토큰 구매한 사용자: ${usersWithPurchase.length}명`);
  console.log(`💬 채팅 세션 보유 사용자: ${new Set(chatSessions.map(s => s.userId)).size}명`);
  console.log(`⚠️  발견된 이슈: ${issuesFound}건`);

  if (issuesFound === 0) {
    console.log('\n🎉 모든 데이터가 정상적으로 구성되어 있습니다!');
  } else {
    console.log('\n⚠️  일부 데이터 불일치가 발견되었습니다. 수동 확인이 필요합니다.');
  }

  await prisma.$disconnect();
}

verifyExistingUsers().catch((error) => {
  console.error('❌ 검증 중 오류 발생:', error);
  process.exit(1);
});
