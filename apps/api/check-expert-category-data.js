const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkExpertCategoryData() {
  try {
    console.log('Checking current ExpertCategory table status...');

    // 1. Check existing ExpertCategory data
    const existingConnections = await prisma.expertCategory.count();
    console.log(`Current ExpertCategory connections: ${existingConnections}`);

    if (existingConnections > 0) {
      const sampleConnections = await prisma.expertCategory.findMany({
        take: 5,
        include: {
          expert: { select: { id: true, name: true, specialty: true } },
          category: { select: { id: true, nameKo: true, slug: true } }
        }
      });

      console.log('\nSample existing connections:');
      sampleConnections.forEach(conn => {
        console.log(`  Expert: ${conn.expert.name} (${conn.expert.specialty}) -> Category: ${conn.category.nameKo}`);
      });
    }

    // 2. Check available experts
    const experts = await prisma.expert.findMany({
      select: { id: true, name: true, specialty: true },
      orderBy: { id: 'asc' }
    });
    console.log(`\nTotal experts: ${experts.length}`);
    console.log('Expert IDs range:', experts.length > 0 ? `${experts[0].id} - ${experts[experts.length - 1].id}` : 'None');

    // 3. Check available categories
    const categories = await prisma.category.findMany({
      select: { id: true, nameKo: true, slug: true },
      orderBy: { id: 'asc' }
    });
    console.log(`\nTotal categories: ${categories.length}`);
    console.log('Category IDs range:', categories.length > 0 ? `${categories[0].id} - ${categories[categories.length - 1].id}` : 'None');

    // 4. Display ID mappings for first 10 experts and categories
    console.log('\nFirst 10 Experts:');
    experts.slice(0, 10).forEach((expert, index) => {
      console.log(`  SQL ID ${index + 1} -> DB ID ${expert.id}: ${expert.name} (${expert.specialty})`);
    });

    console.log('\nFirst 10 Categories:');
    categories.slice(0, 10).forEach((category, index) => {
      console.log(`  SQL ID ${index + 1} -> DB ID ${category.id}: ${category.nameKo} (${category.slug})`);
    });

  } catch (error) {
    console.error('Error checking ExpertCategory data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExpertCategoryData();