const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function insertEducationCareerData() {
  try {
    console.log('🔄 Adding realistic education and career data to experts...');

    // 모든 활성화된 전문가 조회
    const experts = await prisma.expert.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        specialty: true,
        education: true
      }
    });

    console.log(`📊 Found ${experts.length} active experts`);

    // 실제적인 학력 템플릿들
    const educationTemplates = [
      [
        "서울대학교 경영학 학사",
        "연세대학교 경영학 석사 (MBA)",
      ],
      [
        "고려대학교 심리학 학사",
        "서울대학교 상담심리학 석사",
      ],
      [
        "연세대학교 컴퓨터과학 학사",
        "KAIST 전산학 석사",
      ],
      [
        "이화여자대학교 경영학 학사",
        "서강대학교 경영학 석사",
      ],
      [
        "성균관대학교 법학 학사",
        "서울대학교 법학 석사",
      ],
      [
        "한양대학교 산업공학 학사",
        "MIT Sloan School of Management MBA",
      ],
      [
        "중앙대학교 심리학 학사",
        "서울대학교 임상심리학 박사",
      ],
      [
        "건국대학교 경제학 학사",
        "한국과학기술원(KAIST) 경영공학 석사",
      ],
      [
        "동국대학교 국어국문학 학사",
        "연세대학교 교육학 석사",
      ],
      [
        "홍익대학교 경영학 학사",
      ],
      [
        "서울시립대학교 세무학 학사",
        "고려대학교 경영학 석사",
      ],
      [
        "부산대학교 컴퓨터공학 학사",
        "서울대학교 전산학 석사",
      ],
      [
        "숙명여자대학교 경영학 학사",
        "Wharton School MBA",
      ],
      [
        "경희대학교 호텔경영학 학사",
        "Cornell University MBA",
      ]
    ];

    // 실무 경력 템플릿들
    const careerTemplates = [
      [
        "삼성전자 전략기획팀 과장 (5년)",
        "맥킨지앤컴퍼니 시니어 컨설턴트 (3년)",
        "스타트업 COO (2년)"
      ],
      [
        "LG화학 인사팀 차장 (7년)",
        "프리랜서 HR 컨설턴트 (3년)"
      ],
      [
        "네이버 개발팀 시니어 개발자 (6년)",
        "카카오 테크리드 (4년)"
      ],
      [
        "현대자동차 마케팅팀 팀장 (8년)",
        "광고대행사 크리에이티브 디렉터 (2년)"
      ],
      [
        "법무법인 김앤장 변호사 (10년)",
        "기업 법무팀 법무이사 (5년)"
      ],
      [
        "골드만삭스 투자은행 VP (7년)",
        "사모펀드 투자심사역 (3년)"
      ],
      [
        "서울아산병원 임상심리사 (8년)",
        "개인 심리상담소 운영 (5년)"
      ],
      [
        "BCG 컨설턴트 (4년)",
        "롯데그룹 전략기획실 과장 (6년)"
      ],
      [
        "교보생명 상품기획팀 차장 (9년)",
        "핀테크 스타트업 CPO (2년)"
      ],
      [
        "CJ ENM 콘텐츠기획팀 팀장 (7년)",
        "독립 프로듀서 (3년)"
      ],
      [
        "삼성증권 리서치센터 애널리스트 (6년)",
        "자산운용사 포트폴리오 매니저 (4년)"
      ],
      [
        "구글 코리아 프로덕트 매니저 (5년)",
        "쿠팡 서비스기획팀 팀장 (3년)"
      ],
      [
        "딜로이트 컨설팅 매니저 (6년)",
        "대기업 디지털혁신팀 부장 (4년)"
      ],
      [
        "아모레퍼시픽 브랜드매니저 (8년)",
        "뷰티 스타트업 CMO (2년)"
      ]
    ];

    let totalUpdated = 0;

    for (const expert of experts) {
      // 이미 상세한 학력 정보가 있는지 확인 (대학교명이 포함되어 있는지)
      const hasDetailedEducation = expert.education &&
        Array.isArray(expert.education) &&
        expert.education.some((edu) =>
          typeof edu === 'string' && (edu.includes('대학교') || edu.includes('University'))
        );

      if (hasDetailedEducation) {
        console.log(`⏭️  Expert ${expert.name} (ID: ${expert.id}) already has detailed education`);
        continue;
      }

      // 전문가별로 템플릿 선택 (ID 기반 일관성 유지)
      const educationIndex = expert.id % educationTemplates.length;
      const careerIndex = expert.id % careerTemplates.length;

      const selectedEducation = educationTemplates[educationIndex];
      const selectedCareer = careerTemplates[careerIndex];

      console.log(`📝 Setting education & career for ${expert.name}`);
      console.log(`   🎓 Education: ${selectedEducation.length} degrees`);
      console.log(`   💼 Career: ${selectedCareer.length} positions`);

      try {
        await prisma.expert.update({
          where: { id: expert.id },
          data: {
            education: selectedEducation,
            // career 필드를 portfolioItems에 저장 (기존 스키마 활용)
            portfolioItems: selectedCareer
          }
        });
        totalUpdated++;
        console.log(`✅ Updated education & career for ${expert.name}`);
      } catch (error) {
        console.error(`❌ Failed to update Expert ${expert.id}: ${error.message}`);
      }
    }

    console.log(`\n🎉 Education and career data insertion completed!`);
    console.log(`👥 Total experts updated: ${totalUpdated}`);
    console.log(`👥 Experts already had detailed data: ${experts.length - totalUpdated}`);

    // 결과 확인 - 몇 개 전문가 샘플 출력
    console.log(`\n📋 Sample education and career data:`);
    const sampleExperts = await prisma.expert.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        education: true,
        portfolioItems: true
      }
    });

    sampleExperts.forEach(expert => {
      console.log(`\n👤 ${expert.name} (ID: ${expert.id}):`);

      if (expert.education && Array.isArray(expert.education)) {
        console.log(`   🎓 학력:`);
        expert.education.forEach((edu, idx) => {
          console.log(`      ${idx + 1}. ${edu}`);
        });
      }

      if (expert.portfolioItems && Array.isArray(expert.portfolioItems)) {
        console.log(`   💼 경력:`);
        expert.portfolioItems.forEach((career, idx) => {
          console.log(`      ${idx + 1}. ${career}`);
        });
      }
    });

  } catch (error) {
    console.error('❌ Error during education and career data insertion:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
if (require.main === module) {
  insertEducationCareerData()
    .then(() => {
      console.log('\n✨ All experts education and career data insertion completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Education and career data insertion failed:', error);
      process.exit(1);
    });
}

module.exports = { insertEducationCareerData };