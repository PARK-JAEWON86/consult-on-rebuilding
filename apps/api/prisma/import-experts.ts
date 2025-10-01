import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// SQL 파일의 전문가 데이터를 Prisma 스키마에 맞게 매핑
const expertsData = [
  // User ID 2부터 31까지가 전문가 (expert1~expert30@consult-on.kr)
  { id: 1, displayId: '01HR8F3G2K9M7Q4N', userId: 2, name: '김민지', title: '임상심리사', specialty: '심리상담' },
  { id: 2, displayId: '02JK5L7N9Q1S6P8R', userId: 3, name: '이준호', title: '상담심리사', specialty: '심리상담' },
  { id: 3, displayId: '03MT8P2R4V6X9Z1C', userId: 4, name: '박서준', title: '변호사', specialty: '법률상담' },
  { id: 4, displayId: '04BN7C9E1H3K5M8Q', userId: 5, name: '최유진', title: '변호사', specialty: '법률상담' },
  { id: 5, displayId: '05WZ4F6I8L0N2P5S', userId: 6, name: '정민수', title: '재무설계사', specialty: '재무상담' },
  { id: 6, displayId: '06QS3U5W7Y9A1C4E', userId: 7, name: '강태현', title: '풀스택 개발자', specialty: 'IT상담' },
  { id: 7, displayId: '07DF1G3J5M7P9R2T', userId: 8, name: '윤서연', title: '세무사', specialty: '재무상담' },
  { id: 8, displayId: '08RT6Y8B0D2F4H7K', userId: 9, name: '임지훈', title: '투자자문사', specialty: '재무상담' },
  { id: 9, displayId: '09HK4L6N8Q0S2U5W', userId: 10, name: '한소영', title: '영양사', specialty: '건강상담' },
  { id: 10, displayId: '10UV9X1Z3C5E7G0I', userId: 11, name: '조현우', title: '헬스트레이너', specialty: '건강상담' },
  { id: 11, displayId: '11AN1C3F5H7K9M2O', userId: 12, name: '김다은', title: '커리어코치', specialty: '진로상담' },
  { id: 12, displayId: '12MP8R0T2V4X6Z9B', userId: 13, name: '이채원', title: '개발자', specialty: 'IT상담' },
  { id: 13, displayId: '13YZ6B8D0F2H4J7L', userId: 14, name: '박준영', title: '교육컨설턴트', specialty: '진로상담' },
  { id: 14, displayId: '14JL4N6P8R0T3V5X', userId: 15, name: '최하은', title: 'UX디자이너', specialty: 'IT상담' },
  { id: 15, displayId: '15UW9Y1A3C5E7G0I', userId: 16, name: '정승우', title: '데이터분석가', specialty: 'IT상담' },
  { id: 16, displayId: '16GI7K9M1O3Q5S8U', userId: 17, name: '강민준', title: '학습코치', specialty: '교육상담' },
  { id: 17, displayId: '17SV5X7Z9B1D3F6H', userId: 18, name: '윤재현', title: '영어강사', specialty: '교육상담' },
  { id: 18, displayId: '18FH2J4L6N8P0R3T', userId: 19, name: '임소은', title: '수학강사', specialty: '교육상담' },
  { id: 19, displayId: '19RU0W2Y4A6C8E1G', userId: 20, name: '한지윤', title: '마케팅전문가', specialty: '사업상담' },
  { id: 20, displayId: '20ET8G0I2K4M6O9Q', userId: 21, name: '조아름', title: '창업컨설턴트', specialty: '사업상담' },
  { id: 21, displayId: '21PV6Q8S0U2W4Y7A', userId: 22, name: '김도현', title: 'e커머스전문가', specialty: '사업상담' },
  { id: 22, displayId: '22YB4D6F8H0J2L5N', userId: 23, name: '이서우', title: '그래픽디자이너', specialty: '디자인상담' },
  { id: 23, displayId: '23LO9P1R3T5V7X0Z', userId: 24, name: '박시우', title: '영상편집자', specialty: '디자인상담' },
  { id: 24, displayId: '24ZC2E4G6I8K0M3O', userId: 25, name: '최나연', title: '웹디자이너', specialty: '디자인상담' },
  { id: 25, displayId: '25MQ7S9U1W3Y5A8C', userId: 26, name: '정우진', title: '부동산중개사', specialty: '부동산상담' },
  { id: 26, displayId: '26XF4H6J8L0N2P5R', userId: 27, name: '강서연', title: '인테리어디자이너', specialty: '부동산상담' },
  { id: 27, displayId: '27TW0Y2A4C6E8G1I', userId: 28, name: '윤민재', title: '건축사', specialty: '부동산상담' },
  { id: 28, displayId: '28IP7K9M1O3Q5S8U', userId: 29, name: '임지현', title: '요가강사', specialty: '건강상담' },
  { id: 29, displayId: '29UV5X7Z9B1D3F6H', userId: 30, name: '한준서', title: '필라테스강사', specialty: '건강상담' },
  { id: 30, displayId: '30RL1N3P5R7T9V2X', userId: 31, name: '조예린', title: '명상지도사', specialty: '건강상담' },
];

async function importExperts() {
  console.log('🚀 전문가 데이터 삽입 시작...\n');

  try {
    for (const expert of expertsData) {
      const categoryMap: Record<string, string[]> = {
        '심리상담': ['psychology'],
        '법률상담': ['legal'],
        '재무상담': ['finance'],
        'IT상담': ['it'],
        '건강상담': ['health'],
        '진로상담': ['career'],
        '교육상담': ['education'],
        '사업상담': ['business'],
        '디자인상담': ['design'],
        '부동산상담': ['real-estate'],
      };

      await prisma.expert.create({
        data: {
          id: expert.id,
          displayId: expert.displayId,
          userId: expert.userId,
          name: expert.name,
          title: expert.title,
          specialty: expert.specialty,
          categories: categoryMap[expert.specialty] || ['consulting'],
          bio: `${expert.title} 전문가입니다.`,
          description: `${expert.specialty} 분야의 경험 많은 전문가입니다.`,
          ratingAvg: 4.3 + Math.random() * 0.6, // 4.3 ~ 4.9
          reviewCount: Math.floor(Math.random() * 150) + 50, // 50 ~ 200
          totalSessions: Math.floor(Math.random() * 400) + 100, // 100 ~ 500
          completionRate: Math.floor(Math.random() * 15) + 85, // 85 ~ 100
          repeatClients: Math.floor(Math.random() * 60) + 30, // 30 ~ 90
          hourlyRate: 18000 + Math.floor(Math.random() * 12000), // 18,000 ~ 30,000
          experience: Math.floor(Math.random() * 10) + 4, // 4 ~ 14년
          responseTime: ['30분 이내', '1시간 이내', '2시간 이내'][Math.floor(Math.random() * 3)],
          avgSessionDuration: 60 + Math.floor(Math.random() * 60), // 60 ~ 120분
          level: ['Tier 1 (Lv.200-399)', 'Tier 2 (Lv.400-699)', 'Tier 3 (Lv.700-899)'][Math.floor(Math.random() * 3)],
          mbti: ['ENFP', 'INFJ', 'INTJ', 'ENTP', 'ISFJ', 'ESTJ'][Math.floor(Math.random() * 6)],
          cancellationPolicy: '24시간 전 취소 가능',
          reschedulePolicy: '12시간 전 변경 가능',
          holidayPolicy: '주말 휴무',
          availability: {},
          certifications: [],
          consultationTypes: ['video', 'chat'],
          contactInfo: {},
          education: [],
          languages: ['Korean'],
          portfolioFiles: [],
          portfolioItems: [],
          socialProof: {},
          socialLinks: {},
          specialties: [expert.specialty],
          profileViews: Math.floor(Math.random() * 2000) + 200, // 200 ~ 2200
          isActive: true,
          isProfileComplete: true,
          isProfilePublic: true,
          joinedAt: new Date('2024-06-15'),
          lastActiveAt: new Date(),
        },
      });

      console.log(`✅ ${expert.name} (${expert.title}) 삽입 완료`);
    }

    const expertCount = await prisma.expert.count();
    const userCount = await prisma.user.count();

    console.log('\n📊 최종 결과:');
    console.log(`  - 사용자: ${userCount}명`);
    console.log(`  - 전문가: ${expertCount}명`);
    console.log('\n✅ 모든 전문가 데이터 삽입 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  }
}

importExperts()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });