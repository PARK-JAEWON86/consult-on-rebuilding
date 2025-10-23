/**
 * ExpertApplication의 portfolioImages를 Expert.portfolioFiles로 복사하는 스크립트
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPortfolioData() {
  try {
    console.log('🔧 포트폴리오 데이터 복구 시작...\n');

    // 승인된 ExpertApplication 조회
    const applications = await prisma.expertApplication.findMany({
      where: {
        status: 'APPROVED',
      },
      select: {
        id: true,
        userId: true,
        name: true,
        portfolioImages: true,
      },
    });

    console.log(`📊 총 ${applications.length}개의 승인된 Application 발견\n`);

    let fixedCount = 0;

    for (const app of applications) {
      console.log('─'.repeat(80));
      console.log(`처리 중: Application ID ${app.id} | User ID: ${app.userId} | 이름: ${app.name}`);

      // portfolioImages가 있는지 확인
      let portfolioImages: any[] = [];

      if (app.portfolioImages) {
        if (typeof app.portfolioImages === 'string') {
          try {
            portfolioImages = JSON.parse(app.portfolioImages as string);
          } catch (e) {
            console.log('  ❌ portfolioImages 파싱 실패');
            continue;
          }
        } else if (Array.isArray(app.portfolioImages)) {
          portfolioImages = app.portfolioImages;
        }
      }

      if (portfolioImages.length === 0) {
        console.log('  ⚠️ portfolioImages가 비어있음 - 스킵');
        continue;
      }

      console.log(`  📸 ${portfolioImages.length}개의 이미지 발견`);

      // userId로 Expert 찾기
      const expert = await prisma.expert.findFirst({
        where: {
          userId: app.userId,
        },
        select: {
          id: true,
          displayId: true,
          portfolioFiles: true,
        },
      });

      if (!expert) {
        console.log('  ❌ Expert 레코드를 찾을 수 없음');
        continue;
      }

      console.log(`  ✅ Expert 발견: ID ${expert.id} | Display ID: ${expert.displayId}`);

      // Expert의 portfolioFiles 확인
      let currentPortfolioFiles: any[] = [];
      if (expert.portfolioFiles) {
        if (typeof expert.portfolioFiles === 'string') {
          try {
            currentPortfolioFiles = JSON.parse(expert.portfolioFiles as string);
          } catch (e) {
            // 파싱 실패 - 빈 배열 유지
          }
        } else if (Array.isArray(expert.portfolioFiles)) {
          currentPortfolioFiles = expert.portfolioFiles;
        }
      }

      console.log(`  📁 현재 Expert portfolioFiles: ${currentPortfolioFiles.length}개`);

      // portfolioImages를 portfolioFiles로 복사
      await prisma.expert.update({
        where: {
          id: expert.id,
        },
        data: {
          portfolioFiles: portfolioImages,
        },
      });

      console.log(`  ✅ portfolioFiles 업데이트 완료: ${portfolioImages.length}개 이미지`);
      fixedCount++;
    }

    console.log('\n' + '─'.repeat(80));
    console.log(`\n✅ 복구 완료: ${fixedCount}개의 Expert 레코드 업데이트됨\n`);

  } catch (error) {
    console.error('❌ 에러 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPortfolioData();
