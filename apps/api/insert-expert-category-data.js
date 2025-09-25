const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function insertExpertCategoryData() {
  try {
    console.log('Inserting ExpertCategory connections dynamically...');

    // 기존 데이터 확인
    const existingConnections = await prisma.expertCategory.count();
    console.log(`Current ExpertCategory connections: ${existingConnections}`);

    if (existingConnections > 0) {
      console.log('ExpertCategory connections already exist. Skipping insertion...');
      return;
    }

    // 현재 전문가와 카테고리 데이터 조회
    const experts = await prisma.expert.findMany({
      select: { id: true, name: true, specialty: true },
      orderBy: { id: 'asc' }
    });

    const categories = await prisma.category.findMany({
      select: { id: true, nameKo: true, slug: true },
      orderBy: { id: 'asc' }
    });

    console.log(`Found ${experts.length} experts and ${categories.length} categories`);

    // SQL의 하드코딩된 expert-category 연결 데이터
    // SQL expert ID 1-30 -> DB expert ID 2-31 (index 0-29)
    // SQL category ID 1-26 -> DB category ID 1-26 (direct match)
    const expertCategoryConnections = [
      // 심리상담사들 (SQL experts 1-3 -> DB experts 0-2)
      { expertIndex: 0, categoryId: 1 },   // 김민지 - 심리상담
      { expertIndex: 0, categoryId: 25 },  // 김민지 - 인간관계상담
      { expertIndex: 1, categoryId: 1 },   // 이준호 - 심리상담
      { expertIndex: 1, categoryId: 23 },  // 이준호 - 육아상담
      { expertIndex: 2, categoryId: 1 },   // 박서준 - 심리상담
      { expertIndex: 2, categoryId: 5 },   // 박서준 - 진로상담

      // 법률상담사들 (SQL experts 4-6 -> DB experts 3-5)
      { expertIndex: 3, categoryId: 2 },   // 최유진 - 법률상담
      { expertIndex: 3, categoryId: 21 },  // 최유진 - 부동산상담
      { expertIndex: 4, categoryId: 2 },   // 정민수 - 법률상담
      { expertIndex: 4, categoryId: 8 },   // 정민수 - 사업상담
      { expertIndex: 5, categoryId: 2 },   // 강태현 - 법률상담

      // 재무상담사들 (SQL experts 7-9 -> DB experts 6-8)
      { expertIndex: 6, categoryId: 3 },   // 윤서연 - 재무상담
      { expertIndex: 6, categoryId: 16 },  // 윤서연 - 투자상담
      { expertIndex: 7, categoryId: 3 },   // 임지훈 - 재무상담
      { expertIndex: 7, categoryId: 21 },  // 임지훈 - 부동산상담
      { expertIndex: 8, categoryId: 3 },   // 한소영 - 재무상담
      { expertIndex: 8, categoryId: 16 },  // 한소영 - 투자상담

      // 건강상담사들 (SQL experts 10-12 -> DB experts 9-11)
      { expertIndex: 9, categoryId: 4 },   // 조현우 - 건강상담
      { expertIndex: 9, categoryId: 14 },  // 조현우 - 스포츠상담
      { expertIndex: 10, categoryId: 4 },  // 김하늘 - 건강상담
      { expertIndex: 10, categoryId: 19 }, // 김하늘 - 요리상담
      { expertIndex: 11, categoryId: 4 },  // 이동현 - 건강상담

      // 진로상담사들 (SQL experts 13-15 -> DB experts 12-14)
      { expertIndex: 12, categoryId: 5 },  // 박지민 - 진로상담
      { expertIndex: 12, categoryId: 7 },  // 박지민 - 교육상담
      { expertIndex: 13, categoryId: 5 },  // 최수빈 - 진로상담
      { expertIndex: 13, categoryId: 6 },  // 최수빈 - IT상담
      { expertIndex: 14, categoryId: 5 },  // 정예린 - 진로상담
      { expertIndex: 14, categoryId: 22 }, // 정예린 - 학습상담

      // IT상담사들 (SQL experts 16-18 -> DB experts 15-17)
      { expertIndex: 15, categoryId: 6 },  // 강민호 - IT상담
      { expertIndex: 15, categoryId: 9 },  // 강민호 - 디자인상담
      { expertIndex: 16, categoryId: 6 },  // 윤채원 - IT상담
      { expertIndex: 16, categoryId: 17 }, // 윤채원 - 영상상담
      { expertIndex: 17, categoryId: 6 },  // 임성훈 - IT상담

      // 교육상담사들 (SQL experts 19-21 -> DB experts 18-20)
      { expertIndex: 18, categoryId: 7 },  // 한예슬 - 교육상담
      { expertIndex: 18, categoryId: 22 }, // 한예슬 - 학습상담
      { expertIndex: 19, categoryId: 7 },  // 조태윤 - 교육상담
      { expertIndex: 19, categoryId: 10 }, // 조태윤 - 언어상담
      { expertIndex: 20, categoryId: 7 },  // 김소연 - 교육상담
      { expertIndex: 20, categoryId: 24 }, // 김소연 - 학교상담

      // 사업상담사들 (SQL experts 22-24 -> DB experts 21-23)
      { expertIndex: 21, categoryId: 8 },  // 이재혁 - 사업상담
      { expertIndex: 21, categoryId: 18 }, // 이재혁 - 쇼핑상담
      { expertIndex: 22, categoryId: 8 },  // 박다영 - 사업상담
      { expertIndex: 22, categoryId: 3 },  // 박다영 - 재무상담
      { expertIndex: 23, categoryId: 8 },  // 최동우 - 사업상담

      // 디자인상담사들 (SQL experts 25-27 -> DB experts 24-26)
      { expertIndex: 24, categoryId: 9 },  // 정아름 - 디자인상담
      { expertIndex: 24, categoryId: 17 }, // 정아름 - 영상상담
      { expertIndex: 25, categoryId: 9 },  // 강지우 - 디자인상담
      { expertIndex: 25, categoryId: 13 }, // 강지우 - 미용상담
      { expertIndex: 26, categoryId: 9 },  // 윤서진 - 디자인상담

      // 언어상담사들 (SQL experts 28-30 -> DB experts 27-29)
      { expertIndex: 27, categoryId: 10 }, // 임현수 - 언어상담
      { expertIndex: 27, categoryId: 12 }, // 임현수 - 여행상담
      { expertIndex: 28, categoryId: 10 }, // 한지수 - 언어상담
      { expertIndex: 28, categoryId: 7 },  // 한지수 - 교육상담
      { expertIndex: 29, categoryId: 10 }, // 조민준 - 언어상담
      { expertIndex: 29, categoryId: 11 }  // 조민준 - 음악상담
    ];

    // 연결 데이터 삽입
    let insertedCount = 0;
    console.log(`Inserting ${expertCategoryConnections.length} expert-category connections...`);

    for (const connection of expertCategoryConnections) {
      try {
        const expert = experts[connection.expertIndex];
        const category = categories.find(c => c.id === connection.categoryId);

        if (!expert) {
          console.log(`Expert at index ${connection.expertIndex} not found, skipping...`);
          continue;
        }

        if (!category) {
          console.log(`Category with ID ${connection.categoryId} not found, skipping...`);
          continue;
        }

        await prisma.expertCategory.create({
          data: {
            expertId: expert.id,
            categoryId: category.id,
            assignedAt: new Date('2025-09-01T09:00:00Z')
          }
        });

        insertedCount++;
        console.log(`Connected ${expert.name} -> ${category.nameKo}`);

      } catch (error) {
        console.error(`Failed to create connection for expert index ${connection.expertIndex} and category ${connection.categoryId}:`, error.message);
      }
    }

    console.log(`\nSuccessfully inserted ${insertedCount} expert-category connections!`);

    // 최종 통계 확인
    const stats = await Promise.all([
      prisma.expertCategory.count(),
      prisma.expertCategory.groupBy({
        by: ['categoryId'],
        _count: { categoryId: true },
        include: {
          category: {
            select: { nameKo: true }
          }
        }
      }),
      prisma.expertCategory.groupBy({
        by: ['expertId'],
        _count: { expertId: true }
      })
    ]);

    console.log(`\nFinal statistics:`);
    console.log(`Total expert-category connections: ${stats[0]}`);
    console.log(`Average connections per expert: ${(stats[0] / experts.length).toFixed(1)}`);

    // 카테고리별 전문가 수 (상위 10개)
    const categoryStats = stats[1].sort((a, b) => b._count.categoryId - a._count.categoryId).slice(0, 10);
    console.log(`\nTop 10 categories by expert count:`);
    for (const stat of categoryStats) {
      const category = categories.find(c => c.id === stat.categoryId);
      console.log(`  ${category?.nameKo || 'Unknown'}: ${stat._count.categoryId} experts`);
    }

  } catch (error) {
    console.error('Error inserting expert-category data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertExpertCategoryData();