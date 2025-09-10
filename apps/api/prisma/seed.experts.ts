import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

async function main() {
  const samples = [
    { name: '김전문', title: '세무사', categories: ['tax'], bio: '세무 상담 전문', ratingAvg: 4.8, reviewCount: 120 },
    { name: '이컨설턴트', title: '노무사', categories: ['labor'], bio: '노무 분쟁 해결', ratingAvg: 4.6, reviewCount: 85 },
    { name: '박상담', title: '변호사', categories: ['law'], bio: '법률 자문 및 계약서 리뷰', ratingAvg: 4.9, reviewCount: 200 },
  ];

  for (const s of samples) {
    await prisma.expert.upsert({
      where: { displayId: s.name }, // 임시 키 (첫 실행 시에는 존재하지 않음)
      update: {},
      create: {
        displayId: ulid(),
        name: s.name,
        title: s.title,
        categories: s.categories as any,
        bio: s.bio,
        ratingAvg: s.ratingAvg,
        reviewCount: s.reviewCount,
        isActive: true,
      },
    });
  }
  
  console.log('experts seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
