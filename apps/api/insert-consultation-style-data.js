const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function insertConsultationStyleData() {
  try {
    console.log('🔄 Adding consultation style data to experts...');

    // 모든 활성화된 전문가 조회
    const experts = await prisma.expert.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        mbti: true,
        description: true
      }
    });

    console.log(`📊 Found ${experts.length} active experts`);

    // 상담 스타일 템플릿들 (MBTI별로 매칭)
    const consultationStyles = {
      'INTJ': '체계적이고 논리적인 분석을 통해 근본적인 문제 해결 방안을 제시합니다. 장기적 관점에서 전략적 접근을 선호합니다.',
      'INTP': '다양한 관점에서 문제를 분석하고, 창의적이고 혁신적인 솔루션을 함께 탐구합니다. 자유로운 사고를 장려합니다.',
      'ENTJ': '목표 지향적이고 효율적인 상담을 진행합니다. 구체적인 실행 계획과 단계별 전략을 제시하여 빠른 성과를 도출합니다.',
      'ENTP': '열정적이고 역동적인 대화를 통해 새로운 가능성을 발견합니다. 브레인스토밍과 아이디어 발산을 중시합니다.',
      'INFJ': '깊이 있는 경청과 공감을 바탕으로 진정한 내면의 목소리를 찾아드립니다. 가치관과 의미 중심의 접근을 합니다.',
      'INFP': '따뜻하고 지지적인 분위기에서 개인의 고유한 가치와 잠재력을 발견할 수 있도록 돕습니다. 개별 맞춤형 접근을 중시합니다.',
      'ENFJ': '격려와 동기부여를 통해 긍정적인 변화를 이끌어냅니다. 상담자의 성장과 발전에 집중하며 따뜻한 지지를 제공합니다.',
      'ENFP': '밝고 에너지 넘치는 상담으로 새로운 기회와 가능성을 함께 탐색합니다. 창의적 사고와 열린 마음가짐을 장려합니다.',
      'ISTJ': '신뢰할 수 있고 체계적인 방법론으로 단계별 해결책을 제시합니다. 실용적이고 현실적인 조언을 중시합니다.',
      'ISFJ': '세심하고 배려 깊은 상담으로 안전하고 편안한 환경을 만들어드립니다. 개인의 감정과 상황을 꼼꼼히 고려합니다.',
      'ESTJ': '명확하고 구체적인 가이드라인을 제시하여 효율적인 문제 해결을 돕습니다. 실행력과 책임감을 중시하는 접근법입니다.',
      'ESFJ': '친근하고 따뜻한 분위기에서 상담자의 감정과 관계를 중요하게 여깁니다. 공감과 지지를 바탕으로 한 상담을 진행합니다.',
      'ISTP': '실용적이고 유연한 접근으로 즉시 적용 가능한 솔루션을 제시합니다. 문제 중심의 간결하고 효과적인 상담을 선호합니다.',
      'ISFP': '개인의 고유성을 존중하며 부드럽고 섬세한 접근을 합니다. 상담자의 속도에 맞춰 천천히 깊이 있게 진행합니다.',
      'ESTP': '활동적이고 직접적인 상담으로 당장 시도해볼 수 있는 구체적인 방법들을 제안합니다. 현실적이고 즉흥적인 접근을 선호합니다.',
      'ESFP': '밝고 긍정적인 에너지로 즐겁고 편안한 상담 분위기를 만듭니다. 상담자의 감정과 경험을 소중히 여기는 접근법입니다.'
    };

    let totalUpdated = 0;

    for (const expert of experts) {
      // 이미 description이 설정되어 있고 길이가 충분한지 확인 (상담 스타일이 이미 있을 수 있음)
      if (expert.description && expert.description.length > 100) {
        console.log(`⏭️  Expert ${expert.name} (ID: ${expert.id}) already has detailed description`);
        continue;
      }

      // MBTI에 따른 상담 스타일 선택
      const consultationStyle = consultationStyles[expert.mbti] || '개인의 고유한 특성을 고려하여 맞춤형 상담을 제공합니다. 상담자의 목표 달성을 위해 최선을 다하겠습니다.';

      console.log(`📝 Setting consultation style for ${expert.name} (${expert.mbti})`);

      try {
        await prisma.expert.update({
          where: { id: expert.id },
          data: {
            description: consultationStyle
          }
        });
        totalUpdated++;
        console.log(`✅ Updated consultation style for ${expert.name}`);
      } catch (error) {
        console.error(`❌ Failed to update Expert ${expert.id}: ${error.message}`);
      }
    }

    console.log(`\n🎉 Consultation style data insertion completed!`);
    console.log(`👥 Total experts updated: ${totalUpdated}`);
    console.log(`👥 Experts already had detailed description: ${experts.length - totalUpdated}`);

    // 결과 확인 - 몇 개 전문가 샘플 출력
    console.log(`\n📋 Sample consultation style data:`);
    const sampleExperts = await prisma.expert.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        mbti: true,
        description: true
      }
    });

    sampleExperts.forEach(expert => {
      console.log(`\n👤 ${expert.name} (${expert.mbti}):`);
      console.log(`   📝 ${expert.description?.substring(0, 100)}...`);
    });

  } catch (error) {
    console.error('❌ Error during consultation style data insertion:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
if (require.main === module) {
  insertConsultationStyleData()
    .then(() => {
      console.log('\n✨ All experts consultation style data insertion completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Consultation style data insertion failed:', error);
      process.exit(1);
    });
}

module.exports = { insertConsultationStyleData };