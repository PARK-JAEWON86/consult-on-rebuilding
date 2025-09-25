const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function insertMBTIData() {
  try {
    console.log('🔄 Adding MBTI data to experts...');

    // 모든 활성화된 전문가 조회
    const experts = await prisma.expert.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        mbti: true
      }
    });

    console.log(`📊 Found ${experts.length} active experts`);

    // 16가지 MBTI 유형
    const mbtiTypes = [
      'INTJ', // 전략가
      'INTP', // 사상가
      'ENTJ', // 통솔자
      'ENTP', // 혁신가
      'INFJ', // 옹호자
      'INFP', // 중재자
      'ENFJ', // 선도자
      'ENFP', // 활동가
      'ISTJ', // 사업가
      'ISFJ', // 수호자
      'ESTJ', // 경영자
      'ESFJ', // 집정관
      'ISTP', // 모험가
      'ISFP', // 예술가
      'ESTP', // 사업가
      'ESFP'  // 연예인
    ];

    let totalUpdated = 0;

    for (const expert of experts) {
      // 이미 MBTI가 설정되어 있는지 확인
      if (expert.mbti) {
        console.log(`⏭️  Expert ${expert.name} (ID: ${expert.id}) already has MBTI: ${expert.mbti}`);
        continue;
      }

      // 전문가 ID를 기반으로 MBTI 선택 (일관된 결과를 위해)
      const selectedMBTI = mbtiTypes[expert.id % mbtiTypes.length];

      console.log(`📝 Setting MBTI for ${expert.name}: ${selectedMBTI}`);

      try {
        await prisma.expert.update({
          where: { id: expert.id },
          data: {
            mbti: selectedMBTI
          }
        });
        totalUpdated++;
        console.log(`✅ Updated MBTI for ${expert.name}`);
      } catch (error) {
        console.error(`❌ Failed to update Expert ${expert.id}: ${error.message}`);
      }
    }

    console.log(`\n🎉 MBTI data insertion completed!`);
    console.log(`👥 Total experts updated: ${totalUpdated}`);
    console.log(`👥 Experts already had MBTI: ${experts.length - totalUpdated}`);

    // 결과 확인 - 몇 개 전문가 샘플 출력
    console.log(`\n📋 Sample MBTI data:`);
    const sampleExperts = await prisma.expert.findMany({
      take: 10,
      select: {
        id: true,
        name: true,
        mbti: true
      }
    });

    sampleExperts.forEach(expert => {
      console.log(`👤 ${expert.name} (ID: ${expert.id}): ${expert.mbti || '없음'}`);
    });

    // MBTI 타입별 분포 확인
    console.log(`\n📊 MBTI 타입별 분포:`);
    for (const mbtiType of mbtiTypes) {
      const count = await prisma.expert.count({
        where: {
          mbti: mbtiType,
          isActive: true
        }
      });
      if (count > 0) {
        console.log(`${mbtiType}: ${count}명`);
      }
    }

  } catch (error) {
    console.error('❌ Error during MBTI data insertion:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
if (require.main === module) {
  insertMBTIData()
    .then(() => {
      console.log('\n✨ All experts MBTI data insertion completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 MBTI data insertion failed:', error);
      process.exit(1);
    });
}

module.exports = { insertMBTIData };