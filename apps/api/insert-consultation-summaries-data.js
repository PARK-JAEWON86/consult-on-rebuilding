const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function insertConsultationSummariesData() {
  try {
    console.log('Creating consultation summaries data based on SQL file...');

    // 기존 상담 요약 확인
    const existingSummaries = await prisma.consultationSummary.count();
    console.log(`Currently ${existingSummaries} consultation summaries in database`);

    // 기존 예약과 전문가 확인
    const reservations = await prisma.reservation.findMany({
      where: { status: 'CONFIRMED' },
      select: { id: true, userId: true, expertId: true, note: true },
      orderBy: { id: 'asc' }
    });

    const experts = await prisma.expert.findMany({
      select: { id: true, name: true }
    });

    console.log(`Found ${reservations.length} confirmed reservations and ${experts.length} experts`);

    // SQL 파일의 상담 요약 데이터를 현재 시스템에 맞게 변환
    const summariesData = [
      // 상담 ID 1 -> 첫 번째 예약 (김민지의 스트레스 관리 상담)
      {
        reservationId: reservations[0]?.id,
        summaryTitle: '스트레스 관리 상담 요약',
        summaryContent: '김민지님과의 스트레스 관리 상담에서 직장 스트레스가 주요 원인임을 파악했습니다. 인지행동치료 기법을 통해 스트레스 상황에서의 생각 패턴을 바꾸는 방법을 실습했습니다. 상담자는 스트레스 관리에 대한 구체적인 도구와 기법을 습득했으며, 일상생활에서 적용할 수 있는 실용적인 방법들을 배웠습니다.',
        keyPoints: ["직장 스트레스가 주요 원인", "인지행동치료 기법 적용", "생각 패턴 변화 실습", "실용적인 스트레스 관리 도구 습득"],
        actionItems: ["매일 10분 명상 실천", "스트레스 상황에서 3-3-3 기법 적용", "주간 스트레스 일지 작성", "다음 주 상담 전까지 실천 결과 공유"],
        recommendations: ["규칙적인 운동 루틴 설정", "충분한 수면 시간 확보", "스트레스 해소를 위한 취미 활동 찾기", "직장에서의 경계 설정 연습"],
        followUpPlan: '2주 후 후속 상담 예약하여 실천 결과 점검 및 추가 조언 제공. 필요시 인지행동치료 심화 과정 안내.',
        todoStatus: {
          "meditation": "completed",
          "breathing_exercise": "in_progress",
          "stress_journal": "pending",
          "next_session": "scheduled"
        },
        attachments: ["stress_management_guide.pdf", "meditation_audio.mp3", "breathing_exercise_chart.pdf"],
        isPublic: true,
        createdBy: reservations[0]?.expertId || 2 // 전문가 ID
      },

      // 상담 ID 32 -> 두 번째 예약 (김민지의 대인관계 상담)
      {
        reservationId: reservations[1]?.id,
        summaryTitle: '대인관계 개선 상담 요약',
        summaryContent: '김민지님의 동료들과의 관계에서 발생하는 어려움을 분석했습니다. 효과적인 소통 방법과 갈등 해결 전략을 제시하여 대인관계 개선 방향을 모색했습니다. 상담자는 구체적인 소통 기법을 배웠으며, 갈등 상황에서의 대처 방법을 익혔습니다.',
        keyPoints: ["동료 관계 갈등 원인 분석", "효과적인 소통 기법 습득", "갈등 해결 전략 수립", "대인관계 개선 방향 설정"],
        actionItems: ["적극적 경청 연습", "감정 표현 방법 개선", "갈등 상황에서의 대화 기술 적용", "동료들과의 신뢰 관계 구축"],
        recommendations: ["정기적인 팀 미팅 참여", "동료들과의 개인적 대화 시간 늘리기", "갈등 발생 시 즉시 소통하기", "긍정적인 피드백 주고받기"],
        followUpPlan: '1주 후 실천 결과 점검을 위한 짧은 상담 예약. 필요시 추가 대인관계 코칭 제공.',
        todoStatus: {
          "active_listening": "in_progress",
          "emotion_expression": "pending",
          "conflict_resolution": "in_progress",
          "team_meeting": "scheduled"
        },
        attachments: ["communication_skills_guide.pdf", "conflict_resolution_worksheet.pdf"],
        isPublic: true,
        createdBy: reservations[1]?.expertId || 2
      },

      // 상담 ID 34 -> 네 번째 예약 (이준호의 계약서 검토 상담)
      {
        reservationId: reservations[3]?.id,
        summaryTitle: '부동산 매매 계약서 검토 요약',
        summaryContent: '이준호님의 부동산 매매 계약서를 상세히 검토하여 법적 리스크를 분석했습니다. 계약서의 주요 조항들을 점검하고 수정이 필요한 부분들을 식별했습니다. 상담자는 계약서의 중요 조항들과 주의사항을 이해하게 되었습니다.',
        keyPoints: ["계약서 주요 조항 검토 완료", "법적 리스크 요소 식별", "수정 필요 조항 3가지 발견", "계약서 이해도 향상"],
        actionItems: ["계약 해지 조건 명시 요청", "손해배상 조항 수정 협의", "이행 기한 명확화", "추가 보호 조항 검토"],
        recommendations: ["법무팀과 상담하여 수정사항 검토", "매도자와 수정 조항 협의", "공증인을 통한 계약서 재검토", "보험 가입 검토"],
        followUpPlan: '계약서 수정 완료 후 최종 검토 상담 예약. 필요시 법무 자문 추가 제공.',
        todoStatus: {
          "contract_review": "completed",
          "legal_consultation": "scheduled",
          "insurance_review": "pending",
          "final_review": "pending"
        },
        attachments: ["contract_review_report.pdf", "legal_risks_analysis.pdf", "amendment_suggestions.pdf"],
        isPublic: false,
        createdBy: reservations[3]?.expertId || 3
      },

      // 상담 ID 35 -> 다섯 번째 예약 (이준호의 상속 문제 상담)
      {
        reservationId: reservations[4]?.id,
        summaryTitle: '상속 문제 해결 상담 요약',
        summaryContent: '이준호님의 부모님 상속 문제로 인한 형제 간 갈등을 분석하고 해결 방안을 모색했습니다. 상속법에 따른 권리와 의무를 설명하고, 형제들과의 갈등 해결을 위한 구체적인 방안을 제시했습니다.',
        keyPoints: ["상속법 기본 원리 이해", "형제 간 갈등 원인 분석", "법적 권리와 의무 명확화", "갈등 해결 방안 수립"],
        actionItems: ["상속재산 목록 정리", "형제들과의 대화 시간 설정", "중재자 역할 전문가 상담", "법적 절차 진행 여부 결정"],
        recommendations: ["가족 상담 전문가 연계", "상속재산 분할 협의", "필요시 법원 조정 신청", "가족 화합을 위한 노력"],
        followUpPlan: '2주 후 형제들과의 대화 결과 점검. 필요시 가족 상담 전문가 연계 제공.',
        todoStatus: {
          "inheritance_understanding": "completed",
          "family_dialogue": "scheduled",
          "legal_procedures": "pending",
          "family_counseling": "pending"
        },
        attachments: ["inheritance_law_guide.pdf", "family_mediation_guide.pdf", "legal_procedures_checklist.pdf"],
        isPublic: false,
        createdBy: reservations[4]?.expertId || 3
      },

      // 상담 ID 37 -> 일곱 번째 예약 (박서준의 투자 포트폴리오 상담)
      {
        reservationId: reservations[6]?.id,
        summaryTitle: '투자 포트폴리오 구성 상담 요약',
        summaryContent: '박서준님의 투자 포트폴리오 구성에 대한 상담을 진행했습니다. 리스크 프로파일을 분석하여 개인에게 맞는 투자 전략을 제시했습니다. 균형형 포트폴리오 구성을 통한 안정적인 자산 증식 방안을 모색했습니다.',
        keyPoints: ["개인 리스크 프로파일 분석", "균형형 포트폴리오 구성 방안", "투자 원리 이해", "자산 배분 전략 수립"],
        actionItems: ["주식 60%, 채권 30%, 대체투자 10% 비율로 포트폴리오 구성", "월 50만원 정기 투자 계획 수립", "분기별 포트폴리오 리밸런싱", "투자 성과 모니터링"],
        recommendations: ["인덱스 펀드 투자 시작", "개별 주식 투자 공부", "부동산 투자 검토", "연금저축 가입 고려"],
        followUpPlan: '3개월 후 포트폴리오 성과 점검 상담 예약. 시장 상황에 따른 조정 방안 논의.',
        todoStatus: {
          "portfolio_setup": "in_progress",
          "monthly_investment": "scheduled",
          "rebalancing": "pending",
          "performance_monitoring": "pending"
        },
        attachments: ["portfolio_analysis.xlsx", "investment_guide.pdf", "risk_assessment_chart.pdf"],
        isPublic: true,
        createdBy: reservations[6]?.expertId || 4
      },

      // 상담 ID 38 -> 여덟 번째 예약 (박서준의 자산관리 상담)
      {
        reservationId: reservations[7]?.id,
        summaryTitle: '은퇴 대비 자산관리 상담 요약',
        summaryContent: '박서준님의 은퇴 대비 자산관리 계획을 수립했습니다. 현재 자산 현황을 분석하고 은퇴 후 필요한 생활비를 계산하여 목표 자산 규모를 설정했습니다. 정기적인 리밸런싱과 세금 최적화 방안을 제시했습니다.',
        keyPoints: ["현재 자산 현황 분석 완료", "은퇴 후 생활비 계산", "목표 자산 규모 설정", "자산관리 전략 수립"],
        actionItems: ["월 100만원 추가 저축", "기존 포트폴리오 리밸런싱", "세금 최적화 방안 적용", "정기적인 자산 점검"],
        recommendations: ["연금저축 가입", "퇴직연금 추가 납입", "부동산 투자 검토", "보험 상품 점검"],
        followUpPlan: '6개월 후 자산관리 성과 점검 상담 예약. 시장 상황에 따른 전략 조정 논의.',
        todoStatus: {
          "asset_analysis": "completed",
          "monthly_savings": "in_progress",
          "rebalancing": "scheduled",
          "tax_optimization": "pending"
        },
        attachments: ["asset_analysis.xlsx", "retirement_plan.pdf", "tax_optimization_guide.pdf"],
        isPublic: false,
        createdBy: reservations[7]?.expertId || 4
      },

      // 상담 ID 40 -> 열 번째 예약 (최유진의 건강상담)
      {
        reservationId: reservations[9]?.id,
        summaryTitle: '건강상담 및 영양관리 요약',
        summaryContent: '최유진님의 건강 상태를 점검하고 개인 맞춤형 영양 관리 계획을 수립했습니다. 운동 루틴과 식단 가이드를 제공하여 전반적인 건강 개선 방향을 제시했습니다.',
        keyPoints: ["건강 상태 전반적 점검", "개인 맞춤형 영양 계획 수립", "운동 루틴 설계", "건강 개선 목표 설정"],
        actionItems: ["주 3회 30분 이상 유산소 운동", "균형 잡힌 식단 구성", "충분한 수면 시간 확보", "정기적인 건강 검진"],
        recommendations: ["헬스장 등록 고려", "영양사 상담 예약", "건강 앱 활용", "가족과 함께 건강한 식단 실천"],
        followUpPlan: '1개월 후 건강 상태 재점검 상담 예약. 운동 및 식단 실천 결과 평가.',
        todoStatus: {
          "health_check": "completed",
          "exercise_routine": "in_progress",
          "nutrition_plan": "in_progress",
          "health_checkup": "scheduled"
        },
        attachments: ["nutrition_plan.pdf", "exercise_routine.pdf", "health_tracking_sheet.pdf"],
        isPublic: true,
        createdBy: reservations[9]?.expertId || 5
      },

      // 상담 ID 41 -> 열한 번째 예약 (최유진의 다이어트 상담)
      {
        reservationId: reservations[10]?.id,
        summaryTitle: '다이어트 상담 요약',
        summaryContent: '최유진님의 다이어트 목표를 설정하고 현재 식습관을 분석했습니다. 건강한 다이어트 방법을 제시하고 운동 계획을 수립했습니다. 체중 감량을 위한 모니터링 방법을 안내했습니다.',
        keyPoints: ["다이어트 목표 설정", "현재 식습관 분석", "건강한 다이어트 방법 제시", "운동 계획 수립"],
        actionItems: ["주간 체중 측정", "칼로리 섭취 기록", "주 4회 운동 실천", "충분한 수분 섭취"],
        recommendations: ["헬스장 등록", "다이어트 앱 활용", "가족과 함께 식단 관리", "정기적인 체성분 측정"],
        followUpPlan: '2주 후 다이어트 진행 상황 점검 상담 예약. 필요시 식단 및 운동 계획 조정.',
        todoStatus: {
          "diet_plan": "in_progress",
          "exercise_plan": "in_progress",
          "weight_tracking": "in_progress",
          "progress_check": "scheduled"
        },
        attachments: ["diet_plan.pdf", "exercise_plan.pdf", "monitoring_sheet.xlsx", "calorie_tracking_guide.pdf"],
        isPublic: true,
        createdBy: reservations[10]?.expertId || 5
      },

      // 상담 ID 43 -> 열세 번째 예약 (정민호의 진로상담)
      {
        reservationId: reservations[12]?.id,
        summaryTitle: '진로상담 및 취업 전략 요약',
        summaryContent: '정민호님의 현재 상황을 분석하고 진로 방향을 설정했습니다. 취업 전략과 이력서 작성 방법을 안내하여 구체적인 진로 개선 방안을 제시했습니다.',
        keyPoints: ["현재 상황 분석", "진로 방향 설정", "취업 전략 수립", "이력서 작성 방법 습득"],
        actionItems: ["이력서 및 자기소개서 작성", "포트폴리오 준비", "면접 준비", "네트워킹 활동"],
        recommendations: ["관심 분야 관련 자격증 취득", "온라인 강의 수강", "인턴십 지원", "멘토 찾기"],
        followUpPlan: '1개월 후 취업 준비 상황 점검 상담 예약. 필요시 면접 준비 특별 상담 제공.',
        todoStatus: {
          "career_planning": "completed",
          "resume_writing": "in_progress",
          "portfolio_preparation": "pending",
          "job_search": "in_progress"
        },
        attachments: ["career_plan.pdf", "resume_template.docx", "interview_guide.pdf", "networking_strategy.pdf"],
        isPublic: true,
        createdBy: reservations[12]?.expertId || 6
      },

      // 상담 ID 44 -> 열네 번째 예약 (정민호의 이직 상담)
      {
        reservationId: reservations[13]?.id,
        summaryTitle: '이직 상담 요약',
        summaryContent: '정민호님의 이직 목표를 설정하고 현재 회사에서의 경험을 분석했습니다. 목표 회사 분석을 진행하고 면접 준비 방법과 네트워킹 전략을 제시했습니다.',
        keyPoints: ["이직 목표 설정", "현재 경험 분석", "목표 회사 분석", "면접 및 네트워킹 전략 수립"],
        actionItems: ["이력서 업데이트", "목표 회사 리스트 작성", "면접 질문 준비", "네트워킹 이벤트 참여"],
        recommendations: ["관심 회사 인사담당자 연결", "업계 세미나 참석", "온라인 프로필 최적화", "추천서 요청"],
        followUpPlan: '2주 후 이직 준비 상황 점검 상담 예약. 면접 결과 공유 및 피드백 제공.',
        todoStatus: {
          "job_search": "in_progress",
          "company_research": "in_progress",
          "interview_prep": "in_progress",
          "networking": "in_progress"
        },
        attachments: ["job_market_analysis.pdf", "interview_guide.pdf", "networking_strategy.pdf", "company_research_template.xlsx"],
        isPublic: false,
        createdBy: reservations[13]?.expertId || 6
      },

      // 상담 ID 46 -> 열여섯 번째 예약 (김태현의 IT상담)
      {
        reservationId: reservations[15]?.id,
        summaryTitle: '프로그래밍 학습 로드맵 상담 요약',
        summaryContent: '김태현님의 현재 프로그래밍 수준을 평가하고 학습 로드맵을 제시했습니다. 프로젝트 기반 학습 방법을 안내하여 체계적인 개발 역량 향상 방안을 모색했습니다.',
        keyPoints: ["현재 프로그래밍 수준 평가", "학습 로드맵 제시", "프로젝트 기반 학습 방법 안내", "개발 역량 향상 방안 수립"],
        actionItems: ["기초 문법 복습", "실전 프로젝트 진행", "온라인 강의 수강", "개발 커뮤니티 참여"],
        recommendations: ["Git 사용법 익히기", "포트폴리오 사이트 제작", "오픈소스 프로젝트 기여", "개발자 컨퍼런스 참석"],
        followUpPlan: '1개월 후 학습 진행 상황 점검 상담 예약. 프로젝트 코드 리뷰 및 피드백 제공.',
        todoStatus: {
          "skill_assessment": "completed",
          "learning_roadmap": "in_progress",
          "project_work": "pending",
          "community_engagement": "pending"
        },
        attachments: ["learning_roadmap.pdf", "project_ideas.pdf", "coding_resources.pdf", "portfolio_guide.pdf"],
        isPublic: true,
        createdBy: reservations[15]?.expertId || 7
      },

      // 상담 ID 47 -> 열일곱 번째 예약 (김태현의 웹개발 상담)
      {
        reservationId: reservations[16]?.id,
        summaryTitle: '웹개발 기술 스택 상담 요약',
        summaryContent: '김태현님의 프로젝트 요구사항을 분석하고 적합한 기술 스택을 선택했습니다. 개발 환경 설정을 안내하고 프로젝트 구조를 설계했습니다. 개발 방법론과 코드 리뷰 방법을 제시했습니다.',
        keyPoints: ["프로젝트 요구사항 분석", "기술 스택 선택", "개발 환경 설정", "프로젝트 구조 설계"],
        actionItems: ["선택된 기술 스택 학습", "개발 환경 구축", "프로젝트 구조 적용", "코딩 컨벤션 숙지"],
        recommendations: ["Git 버전 관리 시스템 구축", "테스트 코드 작성", "CI/CD 파이프라인 구축", "코드 리뷰 문화 정착"],
        followUpPlan: '2주 후 프로젝트 진행 상황 점검 상담 예약. 코드 리뷰 및 기술적 문제 해결 지원.',
        todoStatus: {
          "tech_stack": "selected",
          "dev_environment": "in_progress",
          "project_structure": "in_progress",
          "coding_standards": "pending"
        },
        attachments: ["tech_stack_guide.pdf", "project_structure.pdf", "development_methodology.pdf", "code_review_checklist.pdf"],
        isPublic: true,
        createdBy: reservations[16]?.expertId || 7
      }
    ];

    // 유효한 예약 ID를 가진 요약만 필터링
    const validSummaries = summariesData.filter(summary => summary.reservationId);

    console.log(`Prepared ${validSummaries.length} consultation summaries to insert`);

    // 데이터베이스에 삽입
    let insertedCount = 0;
    for (const summaryData of validSummaries) {
      try {
        const created = await prisma.consultationSummary.create({
          data: summaryData
        });

        console.log(`Created consultation summary: ${created.id} - ${summaryData.summaryTitle} for reservation ${summaryData.reservationId}`);
        insertedCount++;

        // 요청 부하를 줄이기 위해 짧은 지연
        await new Promise(resolve => setTimeout(resolve, 100));

        if (insertedCount % 3 === 0) {
          console.log(`Inserted ${insertedCount} consultation summaries...`);
        }
      } catch (error) {
        console.error(`Failed to create consultation summary for reservation ${summaryData.reservationId}:`, error.message);
      }
    }

    console.log('Consultation summaries data insertion completed!');

    // 최종 통계 확인
    const stats = await Promise.all([
      prisma.consultationSummary.count(),
      prisma.consultationSummary.count({ where: { isPublic: true } }),
      prisma.consultationSummary.count({ where: { isPublic: false } }),
      prisma.consultationSummary.groupBy({
        by: ['createdBy'],
        _count: { createdBy: true }
      })
    ]);

    console.log(`\nFinal statistics:`);
    console.log(`Total consultation summaries: ${stats[0]}`);
    console.log(`Public summaries: ${stats[1]} (${Math.round(stats[1]/stats[0]*100)}%)`);
    console.log(`Private summaries: ${stats[2]} (${Math.round(stats[2]/stats[0]*100)}%)`);
    console.log(`Summaries by expert:`);
    stats[3].forEach(stat => {
      console.log(`  Expert ${stat.createdBy}: ${stat._count.createdBy} summaries`);
    });

  } catch (error) {
    console.error('Error inserting consultation summaries data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertConsultationSummariesData();