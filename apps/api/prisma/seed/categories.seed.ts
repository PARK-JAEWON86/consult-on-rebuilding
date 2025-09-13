export const CATEGORIES = [
  { slug: 'law', nameKo: '법률', icon: 'Scale', order: 10 },
  { slug: 'tax', nameKo: '세무', icon: 'Receipt', order: 20 },
  { slug: 'labor', nameKo: '노무', icon: 'Users', order: 30 },
  { slug: 'it-dev', nameKo: 'IT 개발', icon: 'Code', order: 40 },
  { slug: 'design', nameKo: '디자인', icon: 'Palette', order: 50 },
  { slug: 'marketing', nameKo: '마케팅', icon: 'TrendingUp', order: 60 },
  { slug: 'finance', nameKo: '재무', icon: 'DollarSign', order: 70 },
  { slug: 'startup', nameKo: '창업', icon: 'Rocket', order: 80 },
  { slug: 'sales', nameKo: '영업', icon: 'Briefcase', order: 90 },
  { slug: 'hr', nameKo: '인사', icon: 'UserCheck', order: 100 },
  { slug: 'edu', nameKo: '교육', icon: 'GraduationCap', order: 110 },
  { slug: 'translation', nameKo: '번역', icon: 'Languages', order: 120 },
  { slug: 'music', nameKo: '음악', icon: 'Music', order: 130 },
  { slug: 'art', nameKo: '예술', icon: 'Palette', order: 140 },
  { slug: 'video', nameKo: '영상', icon: 'Video', order: 150 },
  { slug: 'health', nameKo: '건강', icon: 'Heart', order: 160 },
  { slug: 'pet', nameKo: '반려동물', icon: 'PawPrint', order: 170 },
  { slug: 'travel', nameKo: '여행', icon: 'Plane', order: 180 },
  { slug: 'cooking', nameKo: '요리', icon: 'ChefHat', order: 190 },
  { slug: 'beauty', nameKo: '뷰티', icon: 'Scissors', order: 200 },
  { slug: 'realestate', nameKo: '부동산', icon: 'Building2', order: 210 },
  { slug: 'parenting', nameKo: '육아', icon: 'Baby', order: 220 },
  { slug: 'career', nameKo: '커리어', icon: 'Trophy', order: 230 },
  { slug: 'product', nameKo: '상품기획', icon: 'ShoppingBag', order: 240 },
  { slug: 'research', nameKo: '리서치', icon: 'BookOpen', order: 250 },
  { slug: 'mindset', nameKo: '마인드셋', icon: 'Brain', order: 260 },
];

export async function seedCategories(prisma: any) {
  console.log('🌱 Seeding categories...');
  
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }
  
  console.log(`✅ Seeded ${CATEGORIES.length} categories`);
}
