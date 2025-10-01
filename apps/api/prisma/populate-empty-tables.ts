import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Category data with proper mapping to existing expert categories
const categoryData = [
  {
    slug: 'psychology',
    nameKo: '심리상담',
    nameEn: 'Psychology',
    description: '심리 상담 및 정신 건강 관련 전문 상담',
    icon: '🧠',
    order: 1,
    isActive: true,
  },
  {
    slug: 'legal',
    nameKo: '법률상담',
    nameEn: 'Legal',
    description: '법률 자문 및 법적 문제 해결 상담',
    icon: '⚖️',
    order: 2,
    isActive: true,
  },
  {
    slug: 'finance',
    nameKo: '재무상담',
    nameEn: 'Finance',
    description: '재무 계획, 투자, 자산 관리 상담',
    icon: '💰',
    order: 3,
    isActive: true,
  },
  {
    slug: 'career',
    nameKo: '진로상담',
    nameEn: 'Career',
    description: '진로 설계 및 취업, 이직 상담',
    icon: '💼',
    order: 4,
    isActive: true,
  },
  {
    slug: 'health',
    nameKo: '건강상담',
    nameEn: 'Health',
    description: '건강 관리 및 웰빙 상담',
    icon: '🏥',
    order: 5,
    isActive: true,
  },
  {
    slug: 'education',
    nameKo: '교육상담',
    nameEn: 'Education',
    description: '교육 및 학습 관련 상담',
    icon: '📚',
    order: 6,
    isActive: true,
  },
  {
    slug: 'it',
    nameKo: 'IT상담',
    nameEn: 'IT',
    description: 'IT 기술 및 시스템 관련 상담',
    icon: '💻',
    order: 7,
    isActive: true,
  },
  {
    slug: 'business',
    nameKo: '사업상담',
    nameEn: 'Business',
    description: '사업 운영 및 창업 관련 상담',
    icon: '🚀',
    order: 8,
    isActive: true,
  },
  {
    slug: 'design',
    nameKo: '디자인상담',
    nameEn: 'Design',
    description: '디자인 및 브랜딩 관련 상담',
    icon: '🎨',
    order: 9,
    isActive: true,
  },
  {
    slug: 'real-estate',
    nameKo: '부동산상담',
    nameEn: 'Real Estate',
    description: '부동산 투자 및 거래 상담',
    icon: '🏠',
    order: 10,
    isActive: true,
  },
];

async function populateCategories() {
  console.log('📋 Step 1: Populating Category table...\n');

  for (const category of categoryData) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
    console.log(`✅ Category created/updated: ${created.nameKo} (${created.slug})`);
  }

  console.log('\n✅ Category table populated successfully!\n');
}

async function populateExpertCategories() {
  console.log('📋 Step 2: Populating ExpertCategory junction table...\n');

  // Get all experts with their categories
  const experts = await prisma.expert.findMany({
    select: {
      id: true,
      name: true,
      categories: true,
    },
  });

  // Get all categories for mapping
  const categories = await prisma.category.findMany();
  const categoryMap = new Map(categories.map(cat => [cat.slug, cat.id]));

  let linkCount = 0;

  for (const expert of experts) {
    if (Array.isArray(expert.categories)) {
      for (const categorySlug of expert.categories) {
        const categoryId = categoryMap.get(categorySlug);

        if (categoryId) {
          try {
            await prisma.expertCategory.upsert({
              where: {
                expertId_categoryId: {
                  expertId: expert.id,
                  categoryId: categoryId,
                },
              },
              update: {},
              create: {
                expertId: expert.id,
                categoryId: categoryId,
              },
            });
            linkCount++;
            console.log(`✅ Linked Expert "${expert.name}" to category "${categorySlug}"`);
          } catch (error) {
            console.log(`⚠️  Warning: Could not link Expert "${expert.name}" to "${categorySlug}"`);
          }
        } else {
          console.log(`⚠️  Warning: Category "${categorySlug}" not found in database`);
        }
      }
    }
  }

  console.log(`\n✅ ExpertCategory junction table populated: ${linkCount} links created!\n`);
}

async function populateExpertAvailability() {
  console.log('📋 Step 3: Populating ExpertAvailability table...\n');

  const experts = await prisma.expert.findMany({
    select: {
      id: true,
      name: true,
      availabilitySlots: true,
    },
  });

  // Default availability: Monday to Friday, 9 AM to 6 PM
  const defaultAvailability = [
    { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 'THURSDAY', startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '18:00' },
  ];

  let slotCount = 0;

  for (const expert of experts) {
    // Only add default availability if expert has no existing slots
    if (expert.availabilitySlots.length === 0) {
      for (const slot of defaultAvailability) {
        try {
          await prisma.expertAvailability.create({
            data: {
              expertId: expert.id,
              dayOfWeek: slot.dayOfWeek as any,
              startTime: slot.startTime,
              endTime: slot.endTime,
              isActive: true,
              timeZone: 'Asia/Seoul',
            },
          });
          slotCount++;
        } catch (error) {
          console.log(`⚠️  Warning: Could not create availability slot for Expert "${expert.name}"`);
        }
      }
      console.log(`✅ Created default availability for Expert "${expert.name}"`);
    } else {
      console.log(`ℹ️  Expert "${expert.name}" already has ${expert.availabilitySlots.length} availability slots`);
    }
  }

  console.log(`\n✅ ExpertAvailability table populated: ${slotCount} slots created!\n`);
}

async function validateDataConsistency() {
  console.log('📋 Step 4: Validating data consistency...\n');

  // Check 1: All categories are linked to at least one expert
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { expertLinks: true },
      },
    },
  });

  console.log('🔍 Category Usage:');
  categories.forEach(cat => {
    const expertCount = cat._count.expertLinks;
    const status = expertCount > 0 ? '✅' : '⚠️ ';
    console.log(`${status} ${cat.nameKo} (${cat.slug}): ${expertCount} experts`);
  });

  // Check 2: All experts have at least one category
  const expertsWithoutCategories = await prisma.expert.findMany({
    where: {
      categoryLinks: {
        none: {},
      },
    },
    select: { id: true, name: true },
  });

  if (expertsWithoutCategories.length > 0) {
    console.log('\n⚠️  Experts without categories:');
    expertsWithoutCategories.forEach(expert => {
      console.log(`   - ${expert.name} (ID: ${expert.id})`);
    });
  } else {
    console.log('\n✅ All experts have at least one category');
  }

  // Check 3: All active experts have availability slots
  const expertsWithoutAvailability = await prisma.expert.findMany({
    where: {
      isActive: true,
      availabilitySlots: {
        none: {},
      },
    },
    select: { id: true, name: true },
  });

  if (expertsWithoutAvailability.length > 0) {
    console.log('\n⚠️  Active experts without availability:');
    expertsWithoutAvailability.forEach(expert => {
      console.log(`   - ${expert.name} (ID: ${expert.id})`);
    });
  } else {
    console.log('✅ All active experts have availability slots');
  }

  // Summary statistics
  const stats = {
    totalCategories: await prisma.category.count(),
    totalExpertLinks: await prisma.expertCategory.count(),
    totalAvailabilitySlots: await prisma.expertAvailability.count(),
    totalExperts: await prisma.expert.count(),
  };

  console.log('\n📊 Summary Statistics:');
  console.log(`   Categories: ${stats.totalCategories}`);
  console.log(`   Expert-Category Links: ${stats.totalExpertLinks}`);
  console.log(`   Availability Slots: ${stats.totalAvailabilitySlots}`);
  console.log(`   Total Experts: ${stats.totalExperts}`);
  console.log(`   Average Categories per Expert: ${(stats.totalExpertLinks / stats.totalExperts).toFixed(2)}`);
  console.log(`   Average Slots per Expert: ${(stats.totalAvailabilitySlots / stats.totalExperts).toFixed(2)}`);

  console.log('\n✅ Data consistency validation completed!\n');
}

async function main() {
  console.log('🚀 Starting database population for empty tables...\n');
  console.log('=' .repeat(60) + '\n');

  try {
    await populateCategories();
    await populateExpertCategories();
    await populateExpertAvailability();
    await validateDataConsistency();

    console.log('=' .repeat(60));
    console.log('✅ All empty tables populated successfully!');
    console.log('=' .repeat(60));
  } catch (error) {
    console.error('❌ Error during population:', error);
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