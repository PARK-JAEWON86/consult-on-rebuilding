const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixExpertProfiles() {
  try {
    console.log('🔧 Updating expert profiles...');

    // 현재 전문가 수 확인
    const expertCount = await prisma.expert.count();
    console.log(`📊 Found ${expertCount} experts`);

    // 모든 전문가 프로필을 완성 상태로 업데이트
    const result = await prisma.expert.updateMany({
      where: {},
      data: {
        isActive: true,
        isProfileComplete: true,
        isProfilePublic: true
      }
    });

    console.log(`✅ Updated ${result.count} expert profiles`);

    // 업데이트 확인
    const visibleExperts = await prisma.expert.count({
      where: {
        isActive: true,
        isProfileComplete: true,
        isProfilePublic: true
      }
    });

    console.log(`👀 ${visibleExperts} experts are now visible`);

    // 전문가 목록 샘플 조회
    const sampleExperts = await prisma.expert.findMany({
      take: 5,
      select: {
        displayId: true,
        name: true,
        title: true,
        isActive: true,
        isProfileComplete: true,
        isProfilePublic: true
      }
    });

    console.log('📋 Sample experts:', sampleExperts);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixExpertProfiles();