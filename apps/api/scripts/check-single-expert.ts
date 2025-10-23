/**
 * 특정 Expert 레코드 확인
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkExpert() {
  try {
    // User ID 158의 Expert 조회
    const expert = await prisma.expert.findFirst({
      where: {
        userId: 158,
      },
      select: {
        id: true,
        displayId: true,
        name: true,
        portfolioFiles: true,
        certifications: true,
      },
    });

    if (!expert) {
      console.log('❌ Expert를 찾을 수 없습니다.');
      return;
    }

    console.log('✅ Expert 발견:');
    console.log(`  ID: ${expert.id}`);
    console.log(`  Display ID: ${expert.displayId}`);
    console.log(`  이름: ${expert.name}`);
    console.log(`\n📁 portfolioFiles:`);
    console.log(`  타입: ${typeof expert.portfolioFiles}`);

    let portfolioFiles: any[] = [];
    if (expert.portfolioFiles) {
      if (typeof expert.portfolioFiles === 'string') {
        portfolioFiles = JSON.parse(expert.portfolioFiles as string);
      } else if (Array.isArray(expert.portfolioFiles)) {
        portfolioFiles = expert.portfolioFiles;
      }
    }

    console.log(`  항목 수: ${portfolioFiles.length}`);

    if (portfolioFiles.length > 0) {
      portfolioFiles.forEach((item, index) => {
        const preview = typeof item === 'string' ? item.substring(0, 100) + '...' : JSON.stringify(item).substring(0, 100);
        console.log(`  [${index}] ${preview}`);
      });
    }

  } catch (error) {
    console.error('❌ 에러:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExpert();
