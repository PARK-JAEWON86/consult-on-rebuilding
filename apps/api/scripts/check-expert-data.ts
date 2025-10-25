import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkExpertData() {
  try {
    console.log('🔍 박재원 전문가 데이터 확인 중...\n');

    const expert = await prisma.expert.findFirst({
      where: {
        OR: [
          { name: { contains: '박재원' } },
          { name: { contains: '재원' } },
        ],
      },
      include: {
        categoryLinks: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!expert) {
      console.log('❌ 박재원 전문가를 찾을 수 없습니다.');
      return;
    }

    console.log('✅ 전문가 기본 정보:');
    console.log({
      id: expert.id,
      displayId: expert.displayId,
      name: expert.name,
      title: expert.title,
      bio: expert.bio?.substring(0, 50) + '...',
    });

    console.log('\n📋 전문 키워드 (keywords):');
    console.log('  타입:', typeof expert.keywords);
    console.log('  원본 값:', expert.keywords);
    if (typeof expert.keywords === 'string') {
      try {
        const parsed = JSON.parse(expert.keywords);
        console.log('  파싱 결과:', parsed);
      } catch (e) {
        console.log('  ⚠️  JSON 파싱 실패');
      }
    }

    console.log('\n💬 상담 방식 (consultationTypes):');
    console.log('  타입:', typeof expert.consultationTypes);
    console.log('  원본 값:', expert.consultationTypes);
    if (typeof expert.consultationTypes === 'string') {
      try {
        const parsed = JSON.parse(expert.consultationTypes);
        console.log('  파싱 결과:', parsed);
      } catch (e) {
        console.log('  ⚠️  JSON 파싱 실패');
      }
    }

    console.log('\n🏷️  카테고리 정보:');
    console.log('  categories 필드:', expert.categories);
    console.log('  categoryLinks:', expert.categoryLinks.map(link => ({
      categoryId: link.categoryId,
      categoryName: link.category.nameKo,
      slug: link.category.slug,
    })));

    console.log('\n📊 기타 정보:');
    console.log({
      ratingAvg: expert.ratingAvg,
      reviewCount: expert.reviewCount,
      totalSessions: expert.totalSessions,
      experience: expert.experience,
      experienceYears: expert.experienceYears,
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExpertData();
