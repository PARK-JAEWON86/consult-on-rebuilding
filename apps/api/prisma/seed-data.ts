import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting to seed database...');

  // 1. 사용자 데이터
  const testPassword = await argon2.hash('password123');
  
  const user1 = await prisma.user.upsert({
    where: { email: 'user1@test.com' },
    update: {},
    create: {
      email: 'user1@test.com',
      name: '김민준',
      passwordHash: testPassword,
      roles: ['user'],
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'user2@test.com' },
    update: {},
    create: {
      email: 'user2@test.com',
      name: '이서연',
      passwordHash: testPassword,
      roles: ['user'],
    },
  });

  const expertUser1 = await prisma.user.upsert({
    where: { email: 'expert1@test.com' },
    update: {},
    create: {
      email: 'expert1@test.com',
      name: '박지훈',
      passwordHash: testPassword,
      roles: ['expert'],
    },
  });

  const expertUser2 = await prisma.user.upsert({
    where: { email: 'expert2@test.com' },
    update: {},
    create: {
      email: 'expert2@test.com',
      name: '최수진',
      passwordHash: testPassword,
      roles: ['expert'],
    },
  });

  const expertUser3 = await prisma.user.upsert({
    where: { email: 'expert3@test.com' },
    update: {},
    create: {
      email: 'expert3@test.com',
      name: '정우성',
      passwordHash: testPassword,
      roles: ['expert'],
    },
  });

  console.log('✅ Users created');

  // 2. 전문가 데이터
  const expert1 = await prisma.expert.upsert({
    where: { displayId: 'expert-001' },
    update: {},
    create: {
      displayId: 'expert-001',
      userId: expertUser1.id,
      name: '박지훈',
      title: '법무 전문가',
      categories: ['law', 'contract'],
      bio: '15년 경력의 법무 전문가입니다.',
      ratingAvg: 4.8,
      reviewCount: 127,
      hourlyRate: 120000,
      availability: {
        timezone: 'Asia/Seoul',
        schedule: {
          monday: [{ start: '09:00', end: '18:00' }],
          tuesday: [{ start: '09:00', end: '18:00' }],
          wednesday: [{ start: '09:00', end: '18:00' }],
          thursday: [{ start: '09:00', end: '18:00' }],
          friday: [{ start: '09:00', end: '18:00' }]
        }
      },
      certifications: ['변호사 자격증', '기업법무 전문가'],
      consultationTypes: ['video', 'audio', 'chat'],
      contactInfo: { email: 'park.lawyer@example.com', phone: '010-1234-5678' },
      education: ['서울대학교 법학과', '사법연수원 수료'],
      experience: 15,
      languages: ['Korean', 'English'],
      portfolioFiles: [],
      portfolioItems: ['계약서 검토', '법인 설립', '노동법 상담'],
      socialProof: { testimonials: [], achievements: [] },
      specialties: ['계약법', '노동법', '기업법무']
    },
  });

  const expert2 = await prisma.expert.upsert({
    where: { displayId: 'expert-002' },
    update: {},
    create: {
      displayId: 'expert-002',
      userId: expertUser2.id,
      name: '최수진',
      title: '세무 전문가',
      categories: ['tax', 'accounting'],
      bio: '중소기업 세무 전문가입니다.',
      ratingAvg: 4.6,
      reviewCount: 89,
      hourlyRate: 90000,
      availability: {
        timezone: 'Asia/Seoul',
        schedule: {
          monday: [{ start: '10:00', end: '17:00' }],
          tuesday: [{ start: '10:00', end: '17:00' }],
          wednesday: [{ start: '10:00', end: '17:00' }],
          thursday: [{ start: '10:00', end: '17:00' }],
          friday: [{ start: '10:00', end: '17:00' }]
        }
      },
      certifications: ['세무사 자격증', '회계사 자격증'],
      consultationTypes: ['video', 'audio', 'chat'],
      contactInfo: { email: 'choi.tax@example.com', phone: '010-2345-6789' },
      education: ['연세대학교 경영학과', '세무사 시험 합격'],
      experience: 10,
      languages: ['Korean'],
      portfolioFiles: [],
      portfolioItems: ['세무신고', '회계감사', '절세방안'],
      socialProof: { testimonials: [], achievements: [] },
      specialties: ['법인세', '소득세', '부가가치세']
    },
  });

  const expert3 = await prisma.expert.upsert({
    where: { displayId: 'expert-003' },
    update: {},
    create: {
      displayId: 'expert-003',
      userId: expertUser3.id,
      name: '정우성',
      title: '경영 컨설팅',
      categories: ['business', 'startup'],
      bio: '스타트업 및 중소기업 경영 컨설팅 전문가입니다.',
      ratingAvg: 4.9,
      reviewCount: 203,
      hourlyRate: 180000,
      availability: {
        timezone: 'Asia/Seoul',
        schedule: {
          monday: [{ start: '08:00', end: '20:00' }],
          tuesday: [{ start: '08:00', end: '20:00' }],
          wednesday: [{ start: '08:00', end: '20:00' }],
          thursday: [{ start: '08:00', end: '20:00' }],
          friday: [{ start: '08:00', end: '20:00' }],
          saturday: [{ start: '10:00', end: '16:00' }]
        }
      },
      certifications: ['경영지도사', 'MBA'],
      consultationTypes: ['video', 'audio', 'chat'],
      contactInfo: { email: 'jung.consultant@example.com', phone: '010-3456-7890' },
      education: ['KAIST 경영대학원 MBA', '서울대학교 경영학과'],
      experience: 12,
      languages: ['Korean', 'English', 'Chinese'],
      portfolioFiles: [],
      portfolioItems: ['사업계획서 작성', '투자유치', '조직개편'],
      socialProof: { testimonials: [], achievements: [] },
      specialties: ['스타트업 경영', '투자유치', '사업전략']
    },
  });

  console.log('✅ Experts created');

  // 3. 예약 데이터 (다양한 시간대)
  const now = new Date();
  const futureTime1 = new Date(now.getTime() + 30 * 60 * 1000); // 30분 후
  const futureTime2 = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2시간 후
  const pastTime = new Date(now.getTime() - 1 * 60 * 60 * 1000); // 1시간 전

  const reservation1 = await prisma.reservation.upsert({
    where: { displayId: 'res-001' },
    update: {},
    create: {
      displayId: 'res-001',
      userId: user1.id,
      expertId: expert1.id,
      startAt: futureTime1,
      endAt: new Date(futureTime1.getTime() + 30 * 60 * 1000),
      status: 'CONFIRMED',
      cost: 60000,
      note: '계약서 검토 상담',
    },
  });

  const reservation2 = await prisma.reservation.upsert({
    where: { displayId: 'res-002' },
    update: {},
    create: {
      displayId: 'res-002',
      userId: user2.id,
      expertId: expert2.id,
      startAt: futureTime2,
      endAt: new Date(futureTime2.getTime() + 45 * 60 * 1000),
      status: 'CONFIRMED',
      cost: 67500,
      note: '세무 신고 관련 문의',
    },
  });

  const reservation3 = await prisma.reservation.upsert({
    where: { displayId: 'res-003' },
    update: {},
    create: {
      displayId: 'res-003',
      userId: user1.id,
      expertId: expert3.id,
      startAt: pastTime,
      endAt: new Date(pastTime.getTime() + 60 * 60 * 1000),
      status: 'CONFIRMED',
      cost: 180000,
      note: '사업 계획서 검토',
    },
  });

  console.log('✅ Reservations created');

  // 4. 세션 데이터
  const session1 = await prisma.session.upsert({
    where: { displayId: 'session-001' },
    update: {},
    create: {
      displayId: 'session-001',
      reservationId: reservation1.id,
      channel: `channel-${ulid()}`,
      status: 'SCHEDULED',
    },
  });

  const session2 = await prisma.session.upsert({
    where: { displayId: 'session-002' },
    update: {},
    create: {
      displayId: 'session-002',
      reservationId: reservation2.id,
      channel: `channel-${ulid()}`,
      status: 'SCHEDULED',
    },
  });

  const session3 = await prisma.session.upsert({
    where: { displayId: 'session-003' },
    update: {},
    create: {
      displayId: 'session-003',
      reservationId: reservation3.id,
      channel: `channel-${ulid()}`,
      status: 'ENDED',
      startedAt: pastTime,
      endedAt: new Date(pastTime.getTime() + 60 * 60 * 1000),
    },
  });

  console.log('✅ Sessions created');

  // 5. 샘플 리뷰 데이터
  const review1 = await prisma.review.upsert({
    where: { reservationId: reservation3.id },
    update: {},
    create: {
      displayId: ulid(),
      userId: user1.id,
      expertId: expert3.id,
      reservationId: reservation3.id,
      rating: 5,
      content: '정말 유용한 상담이었습니다. 사업 계획서에 대한 구체적이고 실질적인 조언을 받을 수 있었어요. 특히 마케팅 전략 부분에서 많은 도움이 되었습니다.',
      isPublic: true,
    },
  });

  // 더미 리뷰들 (이미 종료된 가상의 예약들)
  // 실제 예약 ID를 사용하여 unique constraint 위반 방지
  const reviewReservations = [
    { id: 10001, userId: user1.id, expertId: expert1.id },
    { id: 10002, userId: user2.id, expertId: expert2.id },
    { id: 10003, userId: user1.id, expertId: expert3.id },
    { id: 10004, userId: user2.id, expertId: expert1.id },
    { id: 10005, userId: user1.id, expertId: expert2.id },
  ];

  for (let i = 0; i < reviewReservations.length; i++) {
    const reservation = reviewReservations[i];
    await prisma.review.create({
      data: {
        displayId: ulid(),
        userId: reservation.userId,
        expertId: reservation.expertId,
        reservationId: reservation.id,
        rating: Math.floor(Math.random() * 2) + 4, // 4-5점
        content: [
          '전문적이고 친절한 상담이었습니다. 복잡한 법적 문제를 쉽게 설명해주셔서 이해하기 좋았어요.',
          '세무 처리에 대한 명확한 가이드를 받을 수 있었습니다. 실무 경험이 풍부하신 것 같아요.',
          '창업 관련 실질적인 조언을 많이 받았습니다. 앞으로도 자주 상담받고 싶어요.',
          '빠른 시간 내에 핵심적인 답변을 받을 수 있었습니다. 매우 만족스러운 상담이었어요.',
          '처음 이용해봤는데 생각보다 훨씬 도움이 되었습니다. 추천합니다!'
        ][i],
        isPublic: true,
      },
    });
  }

  console.log('✅ Reviews created');

  // 6. 샘플 세션 노트
  await prisma.sessionNote.upsert({
    where: { sessionId_userId: { sessionId: session3.id, userId: user1.id } },
    update: {},
    create: {
      sessionId: session3.id,
      userId: user1.id,
      content: '상담 중 메모:\n- 사업자등록 관련 서류 준비 필요\n- 마케팅 예산 20% 증액 검토\n- 다음 달까지 사업계획서 수정본 작성',
    },
  });

  console.log('✅ Session notes created');

  // 크레딧 데이터
  await prisma.creditTransaction.upsert({
    where: { userId_reason_refId: { userId: user1.id, reason: 'charge:initial', refId: 'init-001' } },
    update: {},
    create: {
      userId: user1.id,
      amount: 300000,
      reason: 'charge:initial',
      refId: 'init-001',
    },
  });

  await prisma.creditTransaction.upsert({
    where: { userId_reason_refId: { userId: user2.id, reason: 'charge:initial', refId: 'init-002' } },
    update: {},
    create: {
      userId: user2.id,
      amount: 150000,
      reason: 'charge:initial',
      refId: 'init-002',
    },
  });

  console.log('✅ Credits created');

  console.log('🎉 Database seeding completed successfully!');
  console.log(`
📊 Created data summary:
- Users: 5 (2 clients + 3 experts with passwords)
- Experts: 3
- Reservations: 3 (1 past, 2 future)
- Sessions: 3
- Reviews: 6
- Session Notes: 1
- Credit Transactions: 2

🔐 Test Login Credentials:
👥 Client Accounts:
- Email: user1@test.com / Password: password123
- Email: user2@test.com / Password: password123

👨‍⚕️ Expert Accounts:
- Email: expert1@test.com / Password: password123 (박지훈)
- Email: expert2@test.com / Password: password123 (최수진)
- Email: expert3@test.com / Password: password123 (정우성)

🔗 Test URLs:
- Login: /auth/login
- Session (30min future): /sessions/session-001
- Session (2hr future): /sessions/session-002  
- Session (ended): /sessions/session-003
- Dev tool: /sessions/dev
- Reservations: /me/reservations
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
