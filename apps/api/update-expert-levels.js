/**
 * 기존 전문가들의 level 필드를 새로운 티어 형식으로 업데이트하는 스크립트
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 티어 매핑 함수
function getTierNameByLevel(calculatedLevel) {
  if (calculatedLevel >= 950) return 'Mythical (미시컬)';
  if (calculatedLevel >= 850) return 'Legend (레전드)';
  if (calculatedLevel >= 750) return 'Champion (챔피언)';
  if (calculatedLevel >= 600) return 'Grandmaster (그랜드마스터)';
  if (calculatedLevel >= 450) return 'Master (마스터)';
  if (calculatedLevel >= 300) return 'Diamond (다이아몬드)';
  if (calculatedLevel >= 200) return 'Platinum (플래티넘)';
  if (calculatedLevel >= 120) return 'Gold (골드)';
  if (calculatedLevel >= 70) return 'Silver (실버)';
  if (calculatedLevel >= 30) return 'Bronze (브론즈)';
  return 'Iron (아이언)';
}

// 랭킹 점수 계산 함수
function calculateRankingScore(stats) {
  const totalSessions = stats.totalSessions || 0;
  const avgRating = stats.avgRating || 0;
  const reviewCount = stats.reviewCount || 0;
  const repeatClients = stats.repeatClients || 0;
  const likeCount = stats.likeCount || 0;

  // 입력값 검증
  if (totalSessions < 0 || avgRating < 0 || avgRating > 5 || repeatClients > totalSessions) {
    return 0;
  }

  // 1. 상담 횟수 점수 (무제한 증가, 더 엄격하게)
  const sessionScore = (totalSessions / 8) * 0.25 * 100; // 8회당 1점

  // 2. 평점 점수 (5점 만점 기준)
  const ratingScore = (avgRating / 5) * 0.35 * 100;

  // 3. 리뷰 수 점수 (무제한 증가, 더 엄격하게)
  const reviewScore = (reviewCount / 4) * 0.15 * 100; // 4개당 1점

  // 4. 재방문 고객 비율 점수
  const repeatRate = totalSessions > 0 ? repeatClients / totalSessions : 0;
  const repeatScore = repeatRate * 0.20 * 100;

  // 5. 좋아요 수 점수 (무제한 증가, 더 엄격하게)
  const likeScore = (likeCount / 10) * 0.05 * 100; // 10개당 1점

  const totalScore = sessionScore + ratingScore + reviewScore + repeatScore + likeScore;
  return Math.round(totalScore * 100) / 100;
}

// 레벨 계산 함수
function calculateLevelByScore(rankingScore = 0) {
  if (rankingScore <= 0) return 1;

  // 점수 대비 레벨 매핑 (더 현실적인 스케일링)
  let level;

  if (rankingScore <= 100) {
    // Iron 티어 (1-29): 0-100점
    level = Math.round(1 + (rankingScore / 100) * 28);
  } else if (rankingScore <= 200) {
    // Bronze 티어 (30-69): 100-200점
    level = Math.round(30 + ((rankingScore - 100) / 100) * 39);
  } else if (rankingScore <= 350) {
    // Silver 티어 (70-119): 200-350점
    level = Math.round(70 + ((rankingScore - 200) / 150) * 49);
  } else if (rankingScore <= 800) {
    // Gold 티어 (120-199): 350-800점
    level = Math.round(120 + ((rankingScore - 350) / 450) * 79);
  } else if (rankingScore <= 1200) {
    // Platinum 티어 (200-299): 800-1200점
    level = Math.round(200 + ((rankingScore - 800) / 400) * 99);
  } else if (rankingScore <= 1600) {
    // Diamond 티어 (300-449): 1200-1600점
    level = Math.round(300 + ((rankingScore - 1200) / 400) * 149);
  } else if (rankingScore <= 2000) {
    // Master 티어 (450-599): 1600-2000점
    level = Math.round(450 + ((rankingScore - 1600) / 400) * 149);
  } else if (rankingScore <= 2500) {
    // Grandmaster 티어 (600-749): 2000-2500점
    level = Math.round(600 + ((rankingScore - 2000) / 500) * 149);
  } else if (rankingScore <= 3000) {
    // Champion 티어 (750-849): 2500-3000점
    level = Math.round(750 + ((rankingScore - 2500) / 500) * 99);
  } else if (rankingScore <= 4000) {
    // Legend 티어 (850-949): 3000-4000점
    level = Math.round(850 + ((rankingScore - 3000) / 1000) * 99);
  } else {
    // Mythical 티어 (950-999): 4000점 이상
    const mythicalProgress = Math.min((rankingScore - 4000) / 2000, 1); // 6000점에서 최대
    level = Math.round(950 + mythicalProgress * 49);
  }

  // 1~999 범위로 제한
  return Math.max(1, Math.min(999, level));
}

async function updateExpertLevels() {
  console.log('🚀 전문가 레벨 필드 업데이트 시작...');

  try {
    // 모든 활성 전문가 조회
    const experts = await prisma.expert.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        level: true, // 기존 level 필드
        totalSessions: true,
        ratingAvg: true,
        reviewCount: true,
        repeatClients: true,
      },
    });

    console.log(`📊 총 ${experts.length}명의 전문가 발견`);

    let updated = 0;
    let skipped = 0;

    for (const expert of experts) {
      try {
        // 통계 기반 레벨 계산
        const stats = {
          totalSessions: expert.totalSessions || 0,
          avgRating: expert.ratingAvg || 0,
          reviewCount: expert.reviewCount || 0,
          repeatClients: expert.repeatClients || 0,
          likeCount: 0,
        };

        const rankingScore = calculateRankingScore(stats);
        const calculatedLevel = calculateLevelByScore(rankingScore);
        const newTierName = getTierNameByLevel(calculatedLevel);

        // 기존 레벨이 이미 새로운 형식인지 확인
        const isOldFormat = expert.level && (
          expert.level.includes('Tier ') ||
          expert.level.includes('Lv.') ||
          expert.level === 'Tier 1 (Lv.1-99)'
        );

        if (!isOldFormat && expert.level === newTierName) {
          skipped++;
          continue; // 이미 올바른 형식이면 스킵
        }

        // 레벨 필드 업데이트
        await prisma.expert.update({
          where: { id: expert.id },
          data: {
            level: newTierName,
          },
        });

        console.log(`✅ ${expert.name} (ID: ${expert.id}): "${expert.level}" → "${newTierName}" (Lv.${calculatedLevel})`);
        updated++;

      } catch (error) {
        console.error(`❌ 전문가 ${expert.name} (ID: ${expert.id}) 업데이트 실패:`, error.message);
      }
    }

    console.log(`\n🎉 업데이트 완료!`);
    console.log(`   ✅ 업데이트됨: ${updated}명`);
    console.log(`   ⏭️  스킵됨: ${skipped}명`);
    console.log(`   📊 총 처리: ${experts.length}명`);

  } catch (error) {
    console.error('❌ 전체 업데이트 실패:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
updateExpertLevels();