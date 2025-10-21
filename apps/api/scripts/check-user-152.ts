import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser152() {
  console.log('🔍 사용자 ID: 152 상세 조사\n');

  const aiUsage = await prisma.aIUsage.findUnique({
    where: { userId: 152 },
    include: { user: { select: { email: true } } }
  });

  if (!aiUsage) {
    console.log('❌ 데이터 없음');
    await prisma.$disconnect();
    return;
  }

  const MONTHLY_FREE_TOKENS = 100000;
  const totalAvailable = MONTHLY_FREE_TOKENS + aiUsage.purchasedTokens;
  const remaining = totalAvailable - aiUsage.usedTokens;

  console.log('💰 데이터베이스 값:');
  console.log('   Email:', aiUsage.user.email);
  console.log('   usedTokens:', aiUsage.usedTokens);
  console.log('   purchasedTokens:', aiUsage.purchasedTokens);
  console.log('   totalTurns:', aiUsage.totalTurns);
  console.log('   totalTokens:', aiUsage.totalTokens);
  console.log('\n📊 계산:');
  console.log('   무료:', MONTHLY_FREE_TOKENS);
  console.log('   구매:', aiUsage.purchasedTokens);
  console.log('   총 가용:', totalAvailable);
  console.log('   사용:', aiUsage.usedTokens);
  console.log('   남은 (올바른 값):', remaining);
  console.log('   프론트 표시 (보고됨): 187023\n');

  if (remaining === 187023) {
    console.log('❌ 문제: DB 데이터가 잘못됨!');
  } else {
    console.log('✅ DB는 정상. 프론트엔드 문제 가능성.');
  }

  await prisma.$disconnect();
}

checkUser152().catch(console.error);
