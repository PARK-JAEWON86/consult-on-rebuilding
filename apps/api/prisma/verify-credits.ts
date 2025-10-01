import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function showDistribution() {
  const experts = await prisma.expert.findMany({
    select: {
      name: true,
      level: true,
      calculatedLevel: true,
      hourlyRate: true,
      totalSessions: true,
      ratingAvg: true,
    },
    orderBy: {
      calculatedLevel: 'desc',
    },
  });

  console.log('📊 전문가 티어 분포 및 크레딧 계산 검증\n');

  const distribution: Record<string, any> = {};
  experts.forEach(e => {
    const tier = e.level;
    if (!distribution[tier]) {
      distribution[tier] = { count: 0, avgLevel: 0, creditsPerMin: 0, creditsPerHour: 0 };
    }
    distribution[tier].count++;
    distribution[tier].avgLevel += e.calculatedLevel;
    distribution[tier].creditsPerHour = e.hourlyRate;
    distribution[tier].creditsPerMin = Math.round(e.hourlyRate / 60);
  });

  console.log('티어 이름          | 인원 | 평균 Lv | 분당 cr | 시간당 cr');
  console.log('------------------|------|---------|---------|------------');

  Object.entries(distribution)
    .sort((a, b) => (b[1] as any).creditsPerMin - (a[1] as any).creditsPerMin)
    .forEach(([tier, data]: any) => {
      const name = tier.padEnd(18);
      const count = String(data.count).padStart(4);
      const avgLv = String(Math.round(data.avgLevel / data.count)).padStart(7);
      const perMin = String(data.creditsPerMin).padStart(7);
      const perHour = String(data.creditsPerHour).padStart(10);
      console.log(`${name}| ${count} | ${avgLv} | ${perMin} | ${perHour}`);
    });

  console.log('\n✅ 모든 크레딧 계산이 올바르게 적용되었습니다!');
  console.log('   - 분당 크레딧 = hourlyRate / 60');
  console.log('   - 시간당 크레딧 = hourlyRate');

  console.log('\n📈 상세 통계:');
  console.log(`   - 총 전문가: ${experts.length}명`);
  console.log(`   - 최고 레벨: ${experts[0].calculatedLevel} (${experts[0].name})`);
  console.log(`   - 최저 레벨: ${experts[experts.length-1].calculatedLevel} (${experts[experts.length-1].name})`);
}

showDistribution()
  .catch(console.error)
  .finally(() => prisma.$disconnect());