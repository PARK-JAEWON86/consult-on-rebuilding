import { PrismaClient } from '@prisma/client';
import { seedCategories } from './seed/categories.seed';

const prisma = new PrismaClient();

async function main() {
  // 테스트 사용자 생성
  await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
    },
  });

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
