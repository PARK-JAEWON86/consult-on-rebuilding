/**
 * 포트폴리오 이미지 데이터 확인 스크립트
 * Expert 테이블의 portfolioFiles 필드 데이터를 확인합니다.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPortfolioData() {
  try {
    console.log('🔍 Expert 테이블의 portfolioFiles 데이터 확인 중...\n');

    // 모든 Expert 레코드 조회
    const experts = await prisma.expert.findMany({
      select: {
        id: true,
        displayId: true,
        name: true,
        portfolioFiles: true,
        certifications: true,
        isActive: true,
        userId: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10, // 최근 10개만
    });

    if (experts.length === 0) {
      console.log('⚠️ Expert 레코드가 없습니다.');
      return;
    }

    console.log(`📊 총 ${experts.length}개의 Expert 레코드 발견\n`);

    for (const expert of experts) {
      console.log('─'.repeat(80));
      console.log(`Expert ID: ${expert.id} | Display ID: ${expert.displayId}`);
      console.log(`이름: ${expert.name} | User ID: ${expert.userId}`);
      console.log(`활성 상태: ${expert.isActive ? '✅' : '❌'}`);

      // portfolioFiles 분석
      console.log('\n📁 portfolioFiles:');
      console.log('  타입:', typeof expert.portfolioFiles);
      console.log('  원본:', expert.portfolioFiles);

      if (expert.portfolioFiles) {
        try {
          if (typeof expert.portfolioFiles === 'string') {
            const parsed = JSON.parse(expert.portfolioFiles as string);
            console.log('  파싱 결과:', parsed);
            console.log('  배열 여부:', Array.isArray(parsed));
            console.log('  항목 수:', Array.isArray(parsed) ? parsed.length : 0);
          } else if (Array.isArray(expert.portfolioFiles)) {
            console.log('  이미 배열:', expert.portfolioFiles);
            console.log('  항목 수:', expert.portfolioFiles.length);
          } else {
            console.log('  객체:', expert.portfolioFiles);
          }
        } catch (e) {
          console.log('  ❌ 파싱 실패:', e.message);
        }
      } else {
        console.log('  ⚠️ null 또는 undefined');
      }

      // certifications 분석
      console.log('\n🏆 certifications:');
      console.log('  타입:', typeof expert.certifications);
      console.log('  원본:', expert.certifications);

      if (expert.certifications) {
        try {
          if (typeof expert.certifications === 'string') {
            const parsed = JSON.parse(expert.certifications as string);
            console.log('  파싱 결과:', parsed);
            console.log('  항목 수:', Array.isArray(parsed) ? parsed.length : 0);
          } else if (Array.isArray(expert.certifications)) {
            console.log('  항목 수:', expert.certifications.length);
          }
        } catch (e) {
          console.log('  ❌ 파싱 실패:', e.message);
        }
      } else {
        console.log('  ⚠️ null 또는 undefined');
      }

      console.log('\n');
    }

    console.log('─'.repeat(80));
    console.log('\n✅ 데이터 확인 완료\n');

    // ExpertApplication 테이블도 확인
    console.log('🔍 ExpertApplication 테이블의 portfolioImages 데이터 확인 중...\n');

    const applications = await prisma.expertApplication.findMany({
      select: {
        id: true,
        userId: true,
        name: true,
        status: true,
        portfolioImages: true,
      },
      where: {
        status: 'APPROVED',
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (applications.length === 0) {
      console.log('⚠️ 승인된 ExpertApplication 레코드가 없습니다.\n');
    } else {
      console.log(`📊 총 ${applications.length}개의 승인된 Application 발견\n`);

      for (const app of applications) {
        console.log('─'.repeat(80));
        console.log(`Application ID: ${app.id} | User ID: ${app.userId}`);
        console.log(`이름: ${app.name} | 상태: ${app.status}`);

        console.log('\n📸 portfolioImages:');
        console.log('  타입:', typeof app.portfolioImages);
        console.log('  원본:', app.portfolioImages);

        if (app.portfolioImages) {
          try {
            if (typeof app.portfolioImages === 'string') {
              const parsed = JSON.parse(app.portfolioImages as string);
              console.log('  파싱 결과:', parsed);
              console.log('  항목 수:', Array.isArray(parsed) ? parsed.length : 0);
            } else if (Array.isArray(app.portfolioImages)) {
              console.log('  항목 수:', app.portfolioImages.length);
            }
          } catch (e) {
            console.log('  ❌ 파싱 실패:', e.message);
          }
        } else {
          console.log('  ⚠️ null 또는 undefined');
        }
        console.log('\n');
      }
    }

  } catch (error) {
    console.error('❌ 에러 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPortfolioData();
