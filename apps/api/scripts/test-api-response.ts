import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// parseJsonField 함수 복사 (experts.service.ts와 동일)
const parseJsonField = (field: any): any[] => {
  if (!field) return [];
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch (e) {
      console.warn(`Failed to parse JSON field: ${field}`);
      return [];
    }
  }
  return Array.isArray(field) ? field : [];
};

async function testApiResponse() {
  try {
    console.log('🧪 API 응답 시뮬레이션 테스트\n');

    // 실제 API와 동일한 쿼리
    const expert = await prisma.expert.findFirst({
      where: {
        name: { contains: '박재원' },
        isActive: true,
      },
      include: {
        categoryLinks: {
          include: {
            category: {
              select: {
                nameKo: true,
                nameEn: true,
                slug: true,
              },
            },
          },
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!expert) {
      console.log('❌ 박재원 전문가를 찾을 수 없습니다.');
      return;
    }

    console.log('1️⃣ DB 원본 데이터:');
    console.log('   keywords:', expert.keywords);
    console.log('   consultationTypes:', expert.consultationTypes);
    console.log('   타입 체크:');
    console.log('     keywords is Array?', Array.isArray(expert.keywords));
    console.log('     consultationTypes is Array?', Array.isArray(expert.consultationTypes));

    console.log('\n2️⃣ parseJsonField 처리 후:');
    const parsedKeywords = parseJsonField(expert.keywords);
    const parsedConsultationTypes = parseJsonField(expert.consultationTypes);
    console.log('   keywords:', parsedKeywords);
    console.log('   consultationTypes:', parsedConsultationTypes);

    console.log('\n3️⃣ API 응답 시뮬레이션 (transformedItem):');
    const transformedItem = {
      id: expert.id,
      displayId: expert.displayId,
      name: expert.name,
      title: expert.title,
      categories: expert.categoryLinks.map((link: any) => link.category.nameKo),
      bio: expert.bio,
      avatarUrl: expert.avatarUrl,
      ratingAvg: expert.ratingAvg,
      reviewCount: expert.reviewCount,
      keywords: parsedKeywords,
      consultationTypes: parsedConsultationTypes,
      experience: expert.experience,
      experienceYears: expert.experienceYears,
      totalSessions: expert.totalSessions,
      calculatedLevel: 1,
    };

    console.log(JSON.stringify(transformedItem, null, 2));

    console.log('\n4️⃣ 프론트엔드에서 받을 데이터:');
    console.log('   keywords:', transformedItem.keywords);
    console.log('   keywords.length:', transformedItem.keywords.length);
    console.log('   consultationTypes:', transformedItem.consultationTypes);
    console.log('   consultationTypes.length:', transformedItem.consultationTypes.length);
    console.log('   categories:', transformedItem.categories);

    console.log('\n5️⃣ ExpertList에서 ExpertCard로 전달할 데이터:');
    const expertCardData = {
      keywords: transformedItem.keywords || transformedItem.categories,
      consultationTypes: transformedItem.consultationTypes || ['video', 'chat'],
    };
    console.log('   keywords:', expertCardData.keywords);
    console.log('   consultationTypes:', expertCardData.consultationTypes);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiResponse();
