import { PrismaClient } from '@prisma/client';
import { seedCategories } from './seed/categories.seed';

const prisma = new PrismaClient();

async function main() {
  // 카테고리 시드
  await seedCategories(prisma);

  console.log('✅ Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
