const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // 비밀번호 해시 생성
    const passwordHash = await argon2.hash('testuser123');

    // 테스트 사용자 생성 (전문가와 클라이언트 역할 모두 포함)
    const user = await prisma.user.create({
      data: {
        email: 'testuser@example.com',
        name: '테스트 사용자',
        passwordHash: passwordHash,
        provider: 'local',
        roles: JSON.stringify(['USER', 'EXPERT']), // USER(클라이언트)와 EXPERT 역할 모두 포함
        emailVerifiedAt: new Date(), // 이메일 인증 완료로 설정
      }
    });

    console.log('테스트 사용자가 성공적으로 생성되었습니다:');
    console.log({
      id: user.id,
      email: user.email,
      name: user.name,
      roles: JSON.parse(user.roles),
      createdAt: user.createdAt
    });

    // 전문가 프로필도 생성
    const expert = await prisma.expert.create({
      data: {
        displayId: `expert_${Date.now()}`,
        name: '테스트 전문가',
        title: '테스트 전문가',
        bio: '테스트용 전문가 프로필입니다. 전문가 모드와 사용자 모드를 모두 테스트할 수 있습니다.',
        categories: JSON.stringify(['general', 'test']),
        ratePerMin: 1000,
        isActive: true
      }
    });

    console.log('\n전문가 프로필이 성공적으로 생성되었습니다:');
    console.log({
      id: expert.id,
      displayId: expert.displayId,
      name: expert.name,
      title: expert.title
    });

    // 크레딧 추가 (10000 크레딧)
    await prisma.creditTransaction.create({
      data: {
        userId: user.id,
        amount: 10000,
        reason: 'initial_credit',
        refId: 'test_user_setup'
      }
    });

    console.log('\n10,000 크레딧이 추가되었습니다.');

    console.log('\n=== 로그인 정보 ===');
    console.log('이메일: testuser@example.com');
    console.log('비밀번호: testuser123');
    console.log('\n이 사용자는 전문가 모드와 사용자 모드를 모두 사용할 수 있습니다.');

  } catch (error) {
    if (error.code === 'P2002') {
      console.log('이미 해당 이메일로 등록된 사용자가 있습니다.');
    } else {
      console.error('사용자 생성 중 오류 발생:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();