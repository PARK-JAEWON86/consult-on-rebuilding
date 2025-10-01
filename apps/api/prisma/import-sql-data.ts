import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function importData() {
  console.log('🚀 SQL 데이터 가져오기 시작...\n');

  try {
    // 1. Users SQL 파싱 및 삽입
    const usersSQL = fs.readFileSync('../../database/02_users.sql', 'utf-8');
    const userValues = usersSQL.match(/\((\d+),\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*(?:NULL|'([^']*)'),\s*(?:NULL|'([^']*)'),\s*'(\[[^\]]+\])',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)'\)/g);

    if (!userValues) {
      throw new Error('User 데이터를 파싱할 수 없습니다');
    }

    console.log(`👥 ${userValues.length}명의 사용자 데이터 발견`);

    for (const match of userValues) {
      const parts = match.match(/\((\d+),\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*(?:NULL|'([^']*)'),\s*(?:NULL|'([^']*)'),\s*'(\[[^\]]+\])',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)'\)/);

      if (parts) {
        const [, id, email, name, passwordHash, provider, providerId, avatarUrl, rolesStr, emailVerifiedAt, createdAt, updatedAt] = parts;

        await prisma.user.create({
          data: {
            id: parseInt(id),
            email,
            name,
            passwordHash,
            provider,
            providerId: providerId || null,
            avatarUrl: avatarUrl || null,
            roles: JSON.parse(rolesStr),
            emailVerifiedAt: new Date(emailVerifiedAt),
            createdAt: new Date(createdAt),
            updatedAt: new Date(updatedAt),
          },
        });
      }
    }

    console.log('✅ 사용자 데이터 삽입 완료\n');

    // 2. Experts 데이터 삽입 (간소화 버전)
    console.log('👨‍💼 전문가 데이터 삽입 시작...');

    const expertData = [
      { id: 1, displayId: '01HR8F3G2K9M7Q4N', userId: 2, name: '김민지', title: '임상심리사', specialty: '심리상담' },
      { id: 2, displayId: '02JK5L7N9Q1S6P8R', userId: 3, name: '이준호', title: '상담심리사', specialty: '심리상담' },
      { id: 3, displayId: '03MT8P2R4V6X9Z1C', userId: 4, name: '박서준', title: '변호사', specialty: '법률상담' },
      { id: 4, displayId: '04BN7C9E1H3K5M8Q', userId: 5, name: '최유진', title: '변호사', specialty: '법률상담' },
      { id: 5, displayId: '05WZ4F6I8L0N2P5S', userId: 6, name: '정민수', title: '재무설계사', specialty: '재무상담' },
      { id: 6, displayId: '06QS3U5W7Y9A1C4E', userId: 7, name: '강태현', title: '풀스택 개발자', specialty: 'IT상담' },
      { id: 7, displayId: '07HJ6K8M0O2Q4S7U', userId: 8, name: '윤서연', title: '세무사', specialty: '세무상담' },
      { id: 8, displayId: '08DR3F5H7J9L1N4P', userId: 9, name: '임지훈', title: '건강관리사', specialty: '건강상담' },
      { id: 9, displayId: '09VX2Z4B6D8F0H3J', userId: 10, name: '한소영', title: '부동산중개사', specialty: '부동산상담' },
      { id: 10, displayId: '10LP5N7P9R1T3V6X', userId: 11, name: '조현우', title: '헤드헌터', specialty: '경력개발' },
    ];

    for (const expert of expertData) {
      await prisma.expert.create({
        data: {
          id: expert.id,
          displayId: expert.displayId,
          userId: expert.userId,
          name: expert.name,
          title: expert.title,
          specialty: expert.specialty,
          categories: ['consulting'],
          bio: `${expert.title} 전문가입니다.`,
          ratingAvg: 4.5 + Math.random() * 0.5,
          reviewCount: Math.floor(Math.random() * 100) + 50,
          hourlyRate: 60000 + Math.floor(Math.random() * 40000),
          experience: Math.floor(Math.random() * 10) + 5,
          availability: {},
          certifications: [],
          consultationTypes: ['video', 'chat'],
          contactInfo: {},
          education: [],
          languages: ['Korean'],
          portfolioFiles: [],
          portfolioItems: [],
          socialProof: {},
          specialties: [expert.specialty],
          isActive: true,
          isProfileComplete: true,
          isProfilePublic: true,
        },
      });
    }

    console.log('✅ 전문가 데이터 삽입 완료\n');

    // 3. 결과 확인
    const userCount = await prisma.user.count();
    const expertCount = await prisma.expert.count();

    console.log('📊 삽입 결과:');
    console.log(`  - 사용자: ${userCount}명`);
    console.log(`  - 전문가: ${expertCount}명`);
    console.log('\n✅ 모든 데이터 가져오기 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  }
}

importData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });