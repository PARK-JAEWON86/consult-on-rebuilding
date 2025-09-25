const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkExpertDataConsistency() {
  try {
    console.log('🔍 Checking expert data consistency...');

    const experts = await prisma.expert.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        specialty: true,
        education: true,
        portfolioItems: true, // 경력은 portfolioItems에 저장됨
      }
    });

    console.log(`📊 Found ${experts.length} active experts`);

    experts.forEach(expert => {
      console.log(`\n👤 Expert: ${expert.name} (ID: ${expert.id})`);
      console.log(`   🎯 Specialty: ${expert.specialty}`);

      if (expert.education && Array.isArray(expert.education)) {
        console.log(`   🎓 Education:`);
        expert.education.forEach((edu, idx) => {
          console.log(`      ${idx + 1}. ${edu}`);
        });
      } else {
        console.log(`   🎓 Education: None or not array`);
      }

      if (expert.portfolioItems && Array.isArray(expert.portfolioItems)) {
        console.log(`   💼 Career:`);
        expert.portfolioItems.forEach((career, idx) => {
          console.log(`      ${idx + 1}. ${career}`);
        });
      } else {
        console.log(`   💼 Career: None or not array`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExpertDataConsistency();