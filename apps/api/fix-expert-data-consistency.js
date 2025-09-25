const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixExpertDataConsistency() {
  try {
    console.log('🔧 Fixing expert data consistency...');

    // 전문분야별로 매칭되는 학력과 경력 템플릿 정의
    const expertProfiles = {
      '심리상담': {
        educations: [
          ["고려대학교 심리학 학사", "서울대학교 상담심리학 석사"],
          ["중앙대학교 심리학 학사", "서울대학교 임상심리학 박사"],
          ["연세대학교 심리학 학사", "고려대학교 임상심리학 석사"],
          ["서울대학교 심리학 학사", "연세대학교 상담심리학 석사"],
          ["이화여자대학교 심리학 학사", "서울대학교 심리학 석사"]
        ],
        careers: [
          ["서울아산병원 임상심리사 (8년)", "개인 심리상담소 운영 (5년)"],
          ["삼성서울병원 상담심리사 (6년)", "심리상담센터 소장 (4년)"],
          ["국립정신건강센터 임상심리사 (7년)", "프리랜서 심리상담사 (3년)"],
          ["연세세브란스병원 심리치료사 (5년)", "대학 학생상담센터 상담사 (6년)"],
          ["서울대병원 정신건강의학과 심리사 (9년)", "개인 심리클리닉 운영 (2년)"]
        ]
      },
      '법률상담': {
        educations: [
          ["성균관대학교 법학 학사", "서울대학교 법학 석사"],
          ["서울대학교 법학 학사", "고려대학교 법학 석사"],
          ["연세대학교 법학 학사", "서울대학교 법학 박사"],
          ["고려대학교 법학 학사", "성균관대학교 법학 석사"],
          ["한양대학교 법학 학사", "연세대학교 법학 석사"]
        ],
        careers: [
          ["법무법인 김앤장 변호사 (10년)", "기업 법무팀 법무이사 (5년)"],
          ["법무법인 태평양 변호사 (8년)", "개인 로펌 대표변호사 (7년)"],
          ["대법원 재판연구관 (4년)", "법무법인 광장 파트너 변호사 (9년)"],
          ["검찰청 검사 (6년)", "법무법인 세종 시니어 변호사 (8년)"],
          ["법무부 법무관 (5년)", "기업 준법감시인 (6년)"]
        ]
      },
      '재무상담': {
        educations: [
          ["서울대학교 경영학 학사", "연세대학교 경영학 석사 (MBA)"],
          ["연세대학교 경제학 학사", "서울대학교 경영학 석사"],
          ["고려대학교 경영학 학사", "Wharton School MBA"],
          ["서울시립대학교 세무학 학사", "고려대학교 경영학 석사"],
          ["성균관대학교 경영학 학사", "Chicago Booth MBA"]
        ],
        careers: [
          ["삼성증권 리서치센터 애널리스트 (6년)", "자산운용사 포트폴리오 매니저 (4년)"],
          ["골드만삭스 투자은행 VP (7년)", "사모펀드 투자심사역 (3년)"],
          ["JP모건 투자은행 MD (9년)", "헤지펀드 펀드매니저 (4년)"],
          ["한국은행 금융통화위원회 (5년)", "증권사 리서치센터장 (8년)"],
          ["기업은행 기업금융부 (7년)", "재무 컨설팅펌 파트너 (6년)"]
        ]
      },
      '건강상담': {
        educations: [
          ["서울대학교 의학 학사", "서울대학교 보건학 석사"],
          ["연세대학교 간호학 학사", "서울대학교 보건학 석사"],
          ["가톨릭대학교 의학 학사", "연세대학교 보건학 석사"],
          ["이화여자대학교 식품영양학 학사", "서울대학교 보건학 석사"],
          ["고려대학교 생명과학 학사", "연세대학교 의학 석사"]
        ],
        careers: [
          ["서울대병원 가정의학과 전문의 (10년)", "건강검진센터 원장 (5년)"],
          ["삼성서울병원 내과 전문의 (8년)", "종합병원 건강증진센터 소장 (4년)"],
          ["세브란스병원 영양사 (7년)", "개인 영양상담소 운영 (6년)"],
          ["아산병원 간호사 (6년)", "기업 산업보건 관리자 (5년)"],
          ["국립암센터 연구원 (5년)", "헬스케어 스타트업 CMO (4년)"]
        ]
      },
      '진로상담': {
        educations: [
          ["서울대학교 교육학 학사", "연세대학교 상담심리학 석사"],
          ["연세대학교 심리학 학사", "서울대학교 교육학 석사"],
          ["이화여자대학교 교육학 학사", "고려대학교 진로상담학 석사"],
          ["고려대학교 사회학 학사", "서울대학교 교육학 석사"],
          ["성균관대학교 교육학 학사", "연세대학교 진로상담학 석사"]
        ],
        careers: [
          ["교육부 진로정책과 사무관 (8년)", "대학 진로개발센터 센터장 (5년)"],
          ["한국고용정보원 연구위원 (7년)", "진로상담센터 소장 (6년)"],
          ["대기업 인사팀 부장 (10년)", "헤드헌팅 회사 대표 (4년)"],
          ["공공기관 채용담당 (6년)", "진로상담 전문기관 실장 (7년)"],
          ["대학교 학생처 처장 (9년)", "개인 진로상담소 운영 (3년)"]
        ]
      }
    };

    const experts = await prisma.expert.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        specialty: true,
      }
    });

    console.log(`📊 Found ${experts.length} active experts to update`);

    let updateCount = 0;

    for (const expert of experts) {
      const specialty = expert.specialty;
      const profiles = expertProfiles[specialty];

      if (!profiles) {
        console.log(`⚠️  No profile template for specialty: ${specialty}`);
        continue;
      }

      // 전문가 ID를 기반으로 일관된 교육과 경력 선택
      const educationIndex = expert.id % profiles.educations.length;
      const careerIndex = expert.id % profiles.careers.length;

      const selectedEducation = profiles.educations[educationIndex];
      const selectedCareer = profiles.careers[careerIndex];

      console.log(`\n🔧 Updating ${expert.name} (${specialty}):`);
      console.log(`   🎓 New Education: ${selectedEducation.join(', ')}`);
      console.log(`   💼 New Career: ${selectedCareer.join(', ')}`);

      try {
        await prisma.expert.update({
          where: { id: expert.id },
          data: {
            education: selectedEducation,
            portfolioItems: selectedCareer
          }
        });
        updateCount++;
        console.log(`   ✅ Successfully updated`);
      } catch (error) {
        console.error(`   ❌ Failed to update: ${error.message}`);
      }
    }

    console.log(`\n🎉 Expert data consistency fix completed!`);
    console.log(`📊 Total experts updated: ${updateCount}`);

  } catch (error) {
    console.error('❌ Error during fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
if (require.main === module) {
  fixExpertDataConsistency()
    .then(() => {
      console.log('\n✨ Expert data consistency fix completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Expert data consistency fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixExpertDataConsistency };