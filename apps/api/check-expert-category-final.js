const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkFinalStats() {
  try {
    console.log('Checking final ExpertCategory statistics...');

    // 기본 통계
    const totalConnections = await prisma.expertCategory.count();
    const totalExperts = await prisma.expert.count();
    const totalCategories = await prisma.category.count();

    console.log(`Total expert-category connections: ${totalConnections}`);
    console.log(`Total experts: ${totalExperts}`);
    console.log(`Total categories: ${totalCategories}`);
    console.log(`Average connections per expert: ${(totalConnections / totalExperts).toFixed(1)}`);

    // 카테고리별 전문가 수
    const categoryStats = await prisma.expertCategory.groupBy({
      by: ['categoryId'],
      _count: { categoryId: true }
    });

    console.log(`\nTop categories by expert count:`);
    const categories = await prisma.category.findMany();

    categoryStats
      .sort((a, b) => b._count.categoryId - a._count.categoryId)
      .slice(0, 10)
      .forEach(stat => {
        const category = categories.find(c => c.id === stat.categoryId);
        console.log(`  ${category?.nameKo || 'Unknown'}: ${stat._count.categoryId} experts`);
      });

    // 전문가별 카테고리 수
    const expertStats = await prisma.expertCategory.groupBy({
      by: ['expertId'],
      _count: { expertId: true }
    });

    console.log(`\nExperts with multiple categories:`);
    const experts = await prisma.expert.findMany();

    expertStats
      .filter(stat => stat._count.expertId > 1)
      .sort((a, b) => b._count.expertId - a._count.expertId)
      .slice(0, 10)
      .forEach(stat => {
        const expert = experts.find(e => e.id === stat.expertId);
        console.log(`  ${expert?.name || 'Unknown'}: ${stat._count.expertId} categories`);
      });

    // 샘플 연결 확인
    console.log(`\nSample connections:`);
    const sampleConnections = await prisma.expertCategory.findMany({
      take: 10,
      include: {
        expert: { select: { name: true, specialty: true } },
        category: { select: { nameKo: true } }
      }
    });

    sampleConnections.forEach(conn => {
      console.log(`  ${conn.expert.name} (${conn.expert.specialty}) -> ${conn.category.nameKo}`);
    });

  } catch (error) {
    console.error('Error checking final statistics:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFinalStats();