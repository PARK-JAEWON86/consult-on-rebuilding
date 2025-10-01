import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Full category data from 01_categories.sql with icon names (not emojis)
const categoryData = [
  {
    id: 1,
    slug: 'psychology',
    nameKo: '심리상담',
    nameEn: 'Psychology Counseling',
    icon: 'Brain',
    description: '스트레스, 우울, 불안 등 심리 건강 관련 상담',
    order: 1,
    isActive: true,
  },
  {
    id: 2,
    slug: 'legal',
    nameKo: '법률상담',
    nameEn: 'Legal Advice',
    icon: 'Scale',
    description: '계약, 분쟁, 상속 등 법률 관련 상담',
    order: 2,
    isActive: true,
  },
  {
    id: 3,
    slug: 'finance',
    nameKo: '재무상담',
    nameEn: 'Financial Planning',
    icon: 'DollarSign',
    description: '투자, 자산관리, 세무 등 재무 관련 상담',
    order: 3,
    isActive: true,
  },
  {
    id: 4,
    slug: 'health',
    nameKo: '건강상담',
    nameEn: 'Health Consultation',
    icon: 'Heart',
    description: '영양, 운동, 건강관리 등 건강 관련 상담',
    order: 4,
    isActive: true,
  },
  {
    id: 5,
    slug: 'career',
    nameKo: '진로상담',
    nameEn: 'Career Guidance',
    icon: 'Target',
    description: '취업, 이직, 진로 탐색 등 진로 관련 상담',
    order: 5,
    isActive: true,
  },
  {
    id: 6,
    slug: 'it',
    nameKo: 'IT상담',
    nameEn: 'IT Consultation',
    icon: 'Code',
    description: '프로그래밍, 소프트웨어 개발 등 IT 관련 상담',
    order: 6,
    isActive: true,
  },
  {
    id: 7,
    slug: 'education',
    nameKo: '교육상담',
    nameEn: 'Educational Counseling',
    icon: 'BookOpen',
    description: '학습법, 입시, 유학 등 교육 관련 상담',
    order: 7,
    isActive: true,
  },
  {
    id: 8,
    slug: 'business',
    nameKo: '사업상담',
    nameEn: 'Business Consulting',
    icon: 'Briefcase',
    description: '창업, 경영, 마케팅 등 사업 관련 상담',
    order: 8,
    isActive: true,
  },
  {
    id: 9,
    slug: 'design',
    nameKo: '디자인상담',
    nameEn: 'Design Consultation',
    icon: 'Palette',
    description: 'UI/UX, 그래픽 디자인 등 디자인 관련 상담',
    order: 9,
    isActive: true,
  },
  {
    id: 10,
    slug: 'language',
    nameKo: '언어상담',
    nameEn: 'Language Learning',
    icon: 'Languages',
    description: '외국어 학습, 번역 등 언어 관련 상담',
    order: 10,
    isActive: true,
  },
  {
    id: 11,
    slug: 'music',
    nameKo: '음악상담',
    nameEn: 'Music Instruction',
    icon: 'Music',
    description: '악기, 작곡, 음악 이론 등 음악 관련 상담',
    order: 11,
    isActive: true,
  },
  {
    id: 12,
    slug: 'travel',
    nameKo: '여행상담',
    nameEn: 'Travel Planning',
    icon: 'Plane',
    description: '여행 계획, 관광지 추천 등 여행 관련 상담',
    order: 12,
    isActive: true,
  },
  {
    id: 13,
    slug: 'beauty',
    nameKo: '미용상담',
    nameEn: 'Beauty Consultation',
    icon: 'Scissors',
    description: '헤어, 메이크업, 스타일링 등 미용 관련 상담',
    order: 13,
    isActive: true,
  },
  {
    id: 14,
    slug: 'sports',
    nameKo: '스포츠상담',
    nameEn: 'Sports Coaching',
    icon: 'Trophy',
    description: '운동법, 경기 전략 등 스포츠 관련 상담',
    order: 14,
    isActive: true,
  },
  {
    id: 15,
    slug: 'gardening',
    nameKo: '원예상담',
    nameEn: 'Gardening Advice',
    icon: 'Sprout',
    description: '식물 재배, 정원 가꾸기 등 원예 관련 상담',
    order: 15,
    isActive: true,
  },
  {
    id: 16,
    slug: 'investment',
    nameKo: '투자상담',
    nameEn: 'Investment Advisory',
    icon: 'TrendingUp',
    description: '주식, 부동산, 암호화폐 등 투자 관련 상담',
    order: 16,
    isActive: true,
  },
  {
    id: 17,
    slug: 'video',
    nameKo: '영상상담',
    nameEn: 'Video Production',
    icon: 'Video',
    description: '영상 제작, 편집, 유튜브 등 영상 관련 상담',
    order: 17,
    isActive: true,
  },
  {
    id: 18,
    slug: 'shopping',
    nameKo: '쇼핑상담',
    nameEn: 'Shopping Guide',
    icon: 'ShoppingBag',
    description: '상품 추천, 구매 가이드 등 쇼핑 관련 상담',
    order: 18,
    isActive: true,
  },
  {
    id: 19,
    slug: 'cooking',
    nameKo: '요리상담',
    nameEn: 'Culinary Arts',
    icon: 'ChefHat',
    description: '레시피, 요리법, 식품 영양 등 요리 관련 상담',
    order: 19,
    isActive: true,
  },
  {
    id: 20,
    slug: 'pet-care',
    nameKo: '반려동물상담',
    nameEn: 'Pet Care',
    icon: 'PawPrint',
    description: '펫케어, 훈련, 건강 등 반려동물 관련 상담',
    order: 20,
    isActive: true,
  },
  {
    id: 21,
    slug: 'real-estate',
    nameKo: '부동산상담',
    nameEn: 'Real Estate',
    icon: 'Building2',
    description: '매매, 임대, 투자 등 부동산 관련 상담',
    order: 21,
    isActive: true,
  },
  {
    id: 22,
    slug: 'study',
    nameKo: '학습상담',
    nameEn: 'Study Methods',
    icon: 'GraduationCap',
    description: '공부법, 시험 준비, 학습 계획 등 학습 관련 상담',
    order: 22,
    isActive: true,
  },
  {
    id: 23,
    slug: 'parenting',
    nameKo: '육아상담',
    nameEn: 'Parenting',
    icon: 'Baby',
    description: '육아법, 아이 교육, 양육 등 육아 관련 상담',
    order: 23,
    isActive: true,
  },
  {
    id: 24,
    slug: 'school',
    nameKo: '학교상담',
    nameEn: 'School Counseling',
    icon: 'School',
    description: '입학, 전학, 학교 생활 등 학교 관련 상담',
    order: 24,
    isActive: true,
  },
  {
    id: 25,
    slug: 'relationships',
    nameKo: '인간관계상담',
    nameEn: 'Relationship Counseling',
    icon: 'Users',
    description: '대인관계, 소통, 갈등 해결 등 인간관계 관련 상담',
    order: 25,
    isActive: true,
  },
  {
    id: 26,
    slug: 'others',
    nameKo: '기타',
    nameEn: 'Others',
    icon: 'Star',
    description: '기타 상담 분야',
    order: 26,
    isActive: true,
  },
];

async function updateCategories() {
  console.log('🔄 Updating Category table with icon names...\n');

  // Get existing categories to check which are currently in use
  const existingCategories = await prisma.category.findMany();
  const existingSlugs = new Set(existingCategories.map(cat => cat.slug));

  console.log(`📊 Current categories in database: ${existingCategories.length}`);
  console.log(`📋 Categories to insert/update: ${categoryData.length}\n`);

  let updatedCount = 0;
  let createdCount = 0;

  for (const category of categoryData) {
    try {
      const { id, ...categoryWithoutId } = category;

      const result = await prisma.category.upsert({
        where: { slug: category.slug },
        update: {
          nameKo: category.nameKo,
          nameEn: category.nameEn,
          icon: category.icon,
          description: category.description,
          order: category.order,
          isActive: category.isActive,
        },
        create: categoryWithoutId,
      });

      if (existingSlugs.has(category.slug)) {
        console.log(`✅ Updated: ${category.nameKo} (${category.slug}) - Icon: ${category.icon}`);
        updatedCount++;
      } else {
        console.log(`🆕 Created: ${category.nameKo} (${category.slug}) - Icon: ${category.icon}`);
        createdCount++;
      }
    } catch (error) {
      console.log(`❌ Error processing category ${category.slug}:`, error);
    }
  }

  console.log(`\n✅ Category update completed!`);
  console.log(`   Updated: ${updatedCount} categories`);
  console.log(`   Created: ${createdCount} categories`);
  console.log(`   Total: ${updatedCount + createdCount} categories\n`);
}

async function validateExpertCategoryLinks() {
  console.log('🔍 Validating Expert-Category links...\n');

  // Get all experts with their categories
  const experts = await prisma.expert.findMany({
    select: {
      id: true,
      name: true,
      categories: true,
      categoryLinks: {
        include: {
          category: true,
        },
      },
    },
  });

  // Get all categories
  const categories = await prisma.category.findMany();
  const categoryMap = new Map(categories.map(cat => [cat.slug, cat]));

  console.log('📊 Expert-Category Link Status:\n');

  let validLinks = 0;
  let missingLinks = 0;
  let invalidCategoryRefs = 0;

  for (const expert of experts) {
    const expertCategories = Array.isArray(expert.categories) ? expert.categories : [];
    const linkedCategories = new Set(expert.categoryLinks.map(link => link.category.slug));

    // Check for missing links
    const missingCats = expertCategories.filter(slug => !linkedCategories.has(slug));

    // Check for invalid category references
    const invalidCats = expertCategories.filter(slug => !categoryMap.has(slug));

    if (missingCats.length > 0 || invalidCats.length > 0) {
      console.log(`⚠️  Expert "${expert.name}":`);

      if (invalidCats.length > 0) {
        console.log(`   ❌ Invalid category references: ${invalidCats.join(', ')}`);
        invalidCategoryRefs += invalidCats.length;
      }

      if (missingCats.length > 0) {
        console.log(`   ⚠️  Missing junction links: ${missingCats.join(', ')}`);
        missingLinks += missingCats.length;
      }
    } else {
      validLinks += expert.categoryLinks.length;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Valid links: ${validLinks}`);
  console.log(`   ⚠️  Missing links: ${missingLinks}`);
  console.log(`   ❌ Invalid category references: ${invalidCategoryRefs}`);

  if (missingLinks === 0 && invalidCategoryRefs === 0) {
    console.log(`\n✅ All Expert-Category links are valid!\n`);
  } else {
    console.log(`\n⚠️  Some links need attention\n`);
  }

  return { validLinks, missingLinks, invalidCategoryRefs };
}

async function displayCategoryUsageStatistics() {
  console.log('📊 Category Usage Statistics:\n');

  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: {
          expertLinks: true,
          communityPosts: true,
        },
      },
    },
    orderBy: { order: 'asc' },
  });

  console.log('Category Distribution:');
  console.log('─'.repeat(80));
  console.log(`${'Category'.padEnd(25)} ${'Slug'.padEnd(20)} ${'Icon'.padEnd(15)} ${'Experts'.padEnd(10)} Posts`);
  console.log('─'.repeat(80));

  let categoriesWithExperts = 0;
  let categoriesWithPosts = 0;
  let totalExpertLinks = 0;
  let totalPosts = 0;

  categories.forEach(cat => {
    const expertCount = cat._count.expertLinks;
    const postCount = cat._count.communityPosts;

    if (expertCount > 0) categoriesWithExperts++;
    if (postCount > 0) categoriesWithPosts++;
    totalExpertLinks += expertCount;
    totalPosts += postCount;

    const status = expertCount > 0 ? '✅' : '  ';
    console.log(
      `${status} ${cat.nameKo.padEnd(23)} ${cat.slug.padEnd(20)} ${cat.icon.padEnd(15)} ${expertCount.toString().padStart(7)}    ${postCount}`
    );
  });

  console.log('─'.repeat(80));
  console.log(`\n📈 Summary:`);
  console.log(`   Total categories: ${categories.length}`);
  console.log(`   Categories with experts: ${categoriesWithExperts}`);
  console.log(`   Categories with posts: ${categoriesWithPosts}`);
  console.log(`   Total expert-category links: ${totalExpertLinks}`);
  console.log(`   Total community posts: ${totalPosts}`);
  console.log();
}

async function main() {
  console.log('🚀 Starting Category Update with Icon Names\n');
  console.log('='.repeat(80) + '\n');

  try {
    // Step 1: Update categories
    await updateCategories();

    // Step 2: Validate expert-category links
    const validation = await validateExpertCategoryLinks();

    // Step 3: Display usage statistics
    await displayCategoryUsageStatistics();

    console.log('='.repeat(80));
    if (validation.missingLinks === 0 && validation.invalidCategoryRefs === 0) {
      console.log('✅ Category update completed successfully with perfect data consistency!');
    } else {
      console.log('⚠️  Category update completed but some links need review');
    }
    console.log('='.repeat(80));
  } catch (error) {
    console.error('❌ Error during category update:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });