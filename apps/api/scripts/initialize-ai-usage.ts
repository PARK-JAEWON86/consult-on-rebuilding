import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * AIUsage 초기화 스크립트
 *
 * 목적:
 * - AIUsage 레코드가 없는 모든 사용자에게 초기 100,000 토큰 제공
 * - 기존에 토큰을 사용하거나 구매한 사용자는 그대로 유지
 */
async function initializeAIUsage() {
  console.log('🚀 AIUsage 초기화 시작...\n');

  // 1. 초기화가 필요한 사용자 찾기
  const usersNeedInit = await prisma.user.findMany({
    where: {
      aiUsage: null,
    },
    select: {
      id: true,
      email: true,
    },
  });

  console.log(`📊 초기화 대상 사용자: ${usersNeedInit.length}명`);

  if (usersNeedInit.length === 0) {
    console.log('✅ 모든 사용자가 이미 초기화되어 있습니다.');
    await prisma.$disconnect();
    return;
  }

  // 2. 확인 메시지
  console.log('\n다음 사용자들에게 초기 100,000 토큰을 제공합니다:');
  console.log(`   총 ${usersNeedInit.length}명\n`);

  // 3. 배치로 초기화 실행
  let successCount = 0;
  let errorCount = 0;

  console.log('⏳ 초기화 중...');

  for (const user of usersNeedInit) {
    try {
      await prisma.aIUsage.create({
        data: {
          userId: user.id,
          usedTokens: 0,
          purchasedTokens: 0,
          totalTurns: 0,
          totalTokens: 0,
          monthlyResetDate: new Date(),
        },
      });

      successCount++;

      if (successCount % 10 === 0) {
        console.log(`   ✓ ${successCount}/${usersNeedInit.length} 완료...`);
      }
    } catch (error) {
      console.error(`   ✗ 사용자 ID ${user.id} (${user.email}) 초기화 실패:`, error);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 초기화 완료!');
  console.log('='.repeat(50));
  console.log(`✅ 성공: ${successCount}명`);
  console.log(`❌ 실패: ${errorCount}명`);
  console.log(`📊 총 처리: ${successCount + errorCount}명\n`);

  // 4. 최종 검증
  console.log('🔍 최종 검증 중...');

  const totalUsers = await prisma.user.count();
  const totalAIUsage = await prisma.aIUsage.count();

  console.log(`   전체 사용자: ${totalUsers}명`);
  console.log(`   AIUsage 레코드: ${totalAIUsage}명`);

  if (totalUsers === totalAIUsage) {
    console.log('   ✅ 모든 사용자가 정상적으로 초기화되었습니다!');
  } else {
    console.log(`   ⚠️  차이: ${totalUsers - totalAIUsage}명 (재실행 필요)`);
  }

  // 5. 토큰 분포 확인
  console.log('\n📈 토큰 사용 분포:');

  const distribution = await prisma.aIUsage.groupBy({
    by: ['usedTokens'],
    _count: true,
  });

  const unused = await prisma.aIUsage.count({
    where: { usedTokens: 0 },
  });

  const used = await prisma.aIUsage.count({
    where: { usedTokens: { gt: 0 } },
  });

  console.log(`   - 토큰 미사용 (0): ${unused}명`);
  console.log(`   - 토큰 사용 중 (>0): ${used}명`);

  await prisma.$disconnect();
}

initializeAIUsage().catch((error) => {
  console.error('❌ 초기화 중 오류 발생:', error);
  process.exit(1);
});
