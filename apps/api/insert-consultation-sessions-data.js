const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function insertConsultationSessionsData() {
  try {
    console.log('Creating consultation sessions data based on SQL file...');

    // 기존 세션 확인
    const existingSessions = await prisma.session.count();
    console.log(`Currently ${existingSessions} sessions in database`);

    // 기존 예약 확인
    const reservations = await prisma.reservation.findMany({
      where: { status: 'CONFIRMED' },
      select: { id: true, userId: true, expertId: true, note: true },
      orderBy: { id: 'asc' }
    });

    console.log(`Found ${reservations.length} confirmed reservations`);

    // SQL 파일의 세션 데이터를 현재 시스템에 맞게 변환
    // consultationId를 reservationId로 매핑 (순서대로)
    const sessionsData = [
      // 상담 ID 1 -> 첫 번째 예약 (김민지의 스트레스 관리 상담)
      {
        reservationId: reservations[0]?.id,
        sessionNumber: 1,
        startedAt: new Date('2025-09-10T14:00:00Z'),
        endedAt: new Date('2025-09-10T14:30:00Z'),
        duration: 30,
        status: 'COMPLETED',
        transcript: '안녕하세요. 어떤 스트레스로 고민이신가요? 직장에서 받는 스트레스가 주된 원인인 것 같습니다. 구체적으로 어떤 상황에서 스트레스를 받으시나요?',
        recordingUrl: 'https://recordings.consulton.com/session_1_20240110.mp4',
        attachments: []
      },
      {
        reservationId: reservations[0]?.id,
        sessionNumber: 2,
        startedAt: new Date('2025-09-10T14:30:00Z'),
        endedAt: new Date('2025-09-10T15:00:00Z'),
        duration: 30,
        status: 'COMPLETED',
        transcript: '인지행동치료의 기본 원리를 설명드리겠습니다. 스트레스 상황에서의 생각 패턴을 바꾸는 방법을 실습해보겠습니다.',
        recordingUrl: 'https://recordings.consulton.com/session_2_20240110.mp4',
        attachments: []
      },

      // 상담 ID 32 -> 두 번째 예약 (김민지의 대인관계 상담)
      {
        reservationId: reservations[1]?.id,
        sessionNumber: 1,
        startedAt: new Date('2025-09-12T10:00:00Z'),
        endedAt: new Date('2025-09-12T10:30:00Z'),
        duration: 30,
        status: 'COMPLETED',
        transcript: '동료들과의 관계에서 어떤 어려움을 겪고 계신가요? 구체적인 상황을 말씀해주세요.',
        recordingUrl: null,
        attachments: []
      },
      {
        reservationId: reservations[1]?.id,
        sessionNumber: 2,
        startedAt: new Date('2025-09-12T10:30:00Z'),
        endedAt: new Date('2025-09-12T10:45:00Z'),
        duration: 15,
        status: 'COMPLETED',
        transcript: '효과적인 소통 방법과 갈등 해결 전략을 제시했습니다. 다음 주에 실천해보시고 결과를 공유해주세요.',
        recordingUrl: null,
        attachments: []
      },

      // 상담 ID 33 -> 세 번째 예약 (김민지의 불안장애 상담) - 예정된 세션
      {
        reservationId: reservations[2]?.id,
        sessionNumber: 1,
        startedAt: new Date('2025-09-20T15:00:00Z'),
        endedAt: null,
        duration: 0,
        status: 'SCHEDULED',
        transcript: '',
        recordingUrl: null,
        attachments: []
      },

      // 상담 ID 34 -> 네 번째 예약 (이준호의 계약서 검토 상담)
      {
        reservationId: reservations[3]?.id,
        sessionNumber: 1,
        startedAt: new Date('2025-09-11T16:00:00Z'),
        endedAt: new Date('2025-09-11T17:00:00Z'),
        duration: 60,
        status: 'COMPLETED',
        transcript: '부동산 매매 계약서를 검토한 결과, 다음과 같은 수정 사항이 필요합니다: 1) 계약 해지 조건 명시 2) 손해배상 조항 수정 3) 이행 기한 명확화',
        recordingUrl: 'https://recordings.consulton.com/session_4_20240111.mp4',
        attachments: ['contract_review.pdf', 'legal_risks_analysis.pdf']
      },

      // 상담 ID 35 -> 다섯 번째 예약 (이준호의 상속 문제 상담)
      {
        reservationId: reservations[4]?.id,
        sessionNumber: 1,
        startedAt: new Date('2025-09-13T11:00:00Z'),
        endedAt: new Date('2025-09-13T11:45:00Z'),
        duration: 45,
        status: 'COMPLETED',
        transcript: '상속 문제의 구체적인 상황을 파악했습니다. 형제들과의 갈등 지점을 정리하고 법적 권리를 설명드리겠습니다.',
        recordingUrl: 'https://recordings.consulton.com/session_5_1_20240113.mp4',
        attachments: []
      },
      {
        reservationId: reservations[4]?.id,
        sessionNumber: 2,
        startedAt: new Date('2025-09-13T11:45:00Z'),
        endedAt: new Date('2025-09-13T12:15:00Z'),
        duration: 30,
        status: 'COMPLETED',
        transcript: '상속법에 따른 권리와 의무를 설명하고, 형제들과의 갈등 해결을 위한 구체적인 방안을 제시했습니다.',
        recordingUrl: 'https://recordings.consulton.com/session_5_2_20240113.mp4',
        attachments: ['inheritance_guide.pdf']
      },

      // 상담 ID 36 -> 여섯 번째 예약 (이준호의 회사법 상담) - 예정된 세션
      {
        reservationId: reservations[5]?.id,
        sessionNumber: 1,
        startedAt: new Date('2025-09-22T10:00:00Z'),
        endedAt: null,
        duration: 0,
        status: 'SCHEDULED',
        transcript: '',
        recordingUrl: null,
        attachments: []
      },

      // 상담 ID 37 -> 일곱 번째 예약 (박서준의 투자 포트폴리오 상담)
      {
        reservationId: reservations[6]?.id,
        sessionNumber: 1,
        startedAt: new Date('2025-09-09T15:30:00Z'),
        endedAt: new Date('2025-09-09T16:30:00Z'),
        duration: 60,
        status: 'COMPLETED',
        transcript: '리스크 프로파일을 분석한 결과, 균형형 포트폴리오를 추천드립니다. 주식 60%, 채권 30%, 대체투자 10% 비율로 구성하시면 됩니다.',
        recordingUrl: 'https://recordings.consulton.com/session_7_20240109.mp4',
        attachments: ['portfolio_analysis.xlsx', 'investment_guide.pdf']
      },

      // 상담 ID 38 -> 여덟 번째 예약 (박서준의 자산관리 상담)
      {
        reservationId: reservations[7]?.id,
        sessionNumber: 1,
        startedAt: new Date('2025-09-19T14:00:00Z'),
        endedAt: new Date('2025-09-19T14:45:00Z'),
        duration: 45,
        status: 'COMPLETED',
        transcript: '현재 자산 현황을 분석하고 은퇴 후 필요한 생활비를 계산했습니다. 목표 자산 규모를 설정해보겠습니다.',
        recordingUrl: 'https://recordings.consulton.com/session_8_1_20240114.mp4',
        attachments: ['asset_analysis.xlsx']
      },
      {
        reservationId: reservations[7]?.id,
        sessionNumber: 2,
        startedAt: new Date('2025-09-19T14:45:00Z'),
        endedAt: new Date('2025-09-19T15:15:00Z'),
        duration: 30,
        status: 'COMPLETED',
        transcript: '은퇴 후 생활비를 고려한 자산관리 전략을 수립했습니다. 정기적인 리밸런싱과 세금 최적화 방안을 제시했습니다.',
        recordingUrl: 'https://recordings.consulton.com/session_8_2_20240114.mp4',
        attachments: ['retirement_plan.pdf', 'tax_optimization_guide.pdf']
      },

      // 상담 ID 39 -> 아홉 번째 예약 (박서준의 부동산 투자 상담) - 진행 중인 세션
      {
        reservationId: reservations[8]?.id,
        sessionNumber: 1,
        startedAt: new Date('2025-09-18T16:00:00Z'),
        endedAt: null,
        duration: 0,
        status: 'IN_PROGRESS',
        transcript: '부동산 투자의 기본 원리와 주의사항을 설명하고 있습니다. 현재 시장 상황과 투자 전략에 대해 논의 중입니다.',
        recordingUrl: 'https://recordings.consulton.com/session_9_20240118.mp4',
        attachments: ['real_estate_market_analysis.pdf']
      },

      // 상담 ID 40 -> 열 번째 예약 (최유진의 건강상담)
      {
        reservationId: reservations[9]?.id,
        sessionNumber: 1,
        startedAt: new Date('2025-09-16T11:00:00Z'),
        endedAt: new Date('2025-09-16T12:00:00Z'),
        duration: 60,
        status: 'COMPLETED',
        transcript: '현재 건강 상태를 점검하고 개인 맞춤형 영양 관리 계획을 수립했습니다. 운동 루틴과 식단 가이드를 제공했습니다.',
        recordingUrl: 'https://recordings.consulton.com/session_10_20240116.mp4',
        attachments: ['nutrition_plan.pdf', 'exercise_routine.pdf']
      },

      // 상담 ID 41 -> 열한 번째 예약 (최유진의 다이어트 상담)
      {
        reservationId: reservations[10]?.id,
        sessionNumber: 1,
        startedAt: new Date('2025-09-17T14:00:00Z'),
        endedAt: new Date('2025-09-17T14:45:00Z'),
        duration: 45,
        status: 'COMPLETED',
        transcript: '다이어트 목표를 설정하고 현재 식습관을 분석했습니다. 건강한 다이어트 방법을 제시했습니다.',
        recordingUrl: 'https://recordings.consulton.com/session_11_1_20240117.mp4',
        attachments: ['diet_plan.pdf']
      },
      {
        reservationId: reservations[10]?.id,
        sessionNumber: 2,
        startedAt: new Date('2025-09-17T14:45:00Z'),
        endedAt: new Date('2025-09-17T15:30:00Z'),
        duration: 45,
        status: 'COMPLETED',
        transcript: '운동 계획을 수립하고 체중 감량을 위한 모니터링 방법을 안내했습니다. 주간 체크인 일정을 정했습니다.',
        recordingUrl: 'https://recordings.consulton.com/session_11_2_20240117.mp4',
        attachments: ['exercise_plan.pdf', 'monitoring_sheet.xlsx']
      },

      // 상담 ID 42 -> 열두 번째 예약 (최유진의 운동 상담) - 예정된 세션
      {
        reservationId: reservations[11]?.id,
        sessionNumber: 1,
        startedAt: new Date('2025-09-25T16:00:00Z'),
        endedAt: null,
        duration: 0,
        status: 'SCHEDULED',
        transcript: '',
        recordingUrl: null,
        attachments: []
      },

      // 상담 ID 43 -> 열세 번째 예약 (정민호의 진로상담)
      {
        reservationId: reservations[12]?.id,
        sessionNumber: 1,
        startedAt: new Date('2025-09-19T10:00:00Z'),
        endedAt: new Date('2025-09-19T11:00:00Z'),
        duration: 60,
        status: 'COMPLETED',
        transcript: '현재 상황을 분석하고 진로 방향을 설정했습니다. 취업 전략과 이력서 작성 방법을 안내했습니다.',
        recordingUrl: 'https://recordings.consulton.com/session_13_20240119.mp4',
        attachments: ['career_plan.pdf', 'resume_template.docx']
      },

      // 상담 ID 44 -> 열네 번째 예약 (정민호의 이직 상담)
      {
        reservationId: reservations[13]?.id,
        sessionNumber: 1,
        startedAt: new Date('2025-09-21T15:00:00Z'),
        endedAt: new Date('2025-09-21T15:45:00Z'),
        duration: 45,
        status: 'COMPLETED',
        transcript: '이직 목표를 설정하고 현재 회사에서의 경험을 분석했습니다. 목표 회사 분석을 진행했습니다.',
        recordingUrl: 'https://recordings.consulton.com/session_14_1_20240121.mp4',
        attachments: ['job_market_analysis.pdf']
      },
      {
        reservationId: reservations[13]?.id,
        sessionNumber: 2,
        startedAt: new Date('2025-09-21T15:45:00Z'),
        endedAt: new Date('2025-09-21T16:30:00Z'),
        duration: 45,
        status: 'COMPLETED',
        transcript: '면접 준비 방법과 네트워킹 전략을 제시했습니다. 이력서와 자기소개서 개선 방안을 안내했습니다.',
        recordingUrl: 'https://recordings.consulton.com/session_14_2_20240121.mp4',
        attachments: ['interview_guide.pdf', 'networking_strategy.pdf']
      },

      // 상담 ID 45 -> 열다섯 번째 예약 (정민호의 창업 상담) - 예정된 세션
      {
        reservationId: reservations[14]?.id,
        sessionNumber: 1,
        startedAt: new Date('2025-09-26T14:00:00Z'),
        endedAt: null,
        duration: 0,
        status: 'SCHEDULED',
        transcript: '',
        recordingUrl: null,
        attachments: []
      },

      // 상담 ID 46 -> 열여섯 번째 예약 (김태현의 IT상담)
      {
        reservationId: reservations[15]?.id,
        sessionNumber: 1,
        startedAt: new Date('2025-09-23T09:00:00Z'),
        endedAt: new Date('2025-09-23T10:00:00Z'),
        duration: 60,
        status: 'COMPLETED',
        transcript: '현재 프로그래밍 수준을 평가하고 학습 로드맵을 제시했습니다. 프로젝트 기반 학습 방법을 안내했습니다.',
        recordingUrl: 'https://recordings.consulton.com/session_16_20240123.mp4',
        attachments: ['learning_roadmap.pdf', 'project_ideas.pdf']
      },

      // 상담 ID 47 -> 열일곱 번째 예약 (김태현의 웹개발 상담)
      {
        reservationId: reservations[16]?.id,
        sessionNumber: 1,
        startedAt: new Date('2025-09-24T10:00:00Z'),
        endedAt: new Date('2025-09-24T10:45:00Z'),
        duration: 45,
        status: 'COMPLETED',
        transcript: '프로젝트 요구사항을 분석하고 적합한 기술 스택을 선택했습니다. 개발 환경 설정을 안내했습니다.',
        recordingUrl: 'https://recordings.consulton.com/session_17_1_20240124.mp4',
        attachments: ['tech_stack_guide.pdf']
      },
      {
        reservationId: reservations[16]?.id,
        sessionNumber: 2,
        startedAt: new Date('2025-09-24T10:45:00Z'),
        endedAt: new Date('2025-09-24T11:30:00Z'),
        duration: 45,
        status: 'COMPLETED',
        transcript: '프로젝트 구조를 설계하고 개발 방법론을 제시했습니다. 코드 리뷰와 테스트 방법을 안내했습니다.',
        recordingUrl: 'https://recordings.consulton.com/session_17_2_20240124.mp4',
        attachments: ['project_structure.pdf', 'development_methodology.pdf']
      },

      // 상담 ID 48 -> 열여덟 번째 예약 (김태현의 데이터베이스 상담) - 예정된 세션
      {
        reservationId: reservations[17]?.id,
        sessionNumber: 1,
        startedAt: new Date('2025-09-27T15:00:00Z'),
        endedAt: null,
        duration: 0,
        status: 'SCHEDULED',
        transcript: '',
        recordingUrl: null,
        attachments: []
      }
    ];

    // 유효한 예약 ID를 가진 세션만 필터링
    const validSessions = sessionsData.filter(session => session.reservationId);

    console.log(`Prepared ${validSessions.length} sessions to insert`);

    // 데이터베이스에 삽입
    let insertedCount = 0;
    for (const sessionData of validSessions) {
      try {
        const displayId = `SESS${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        const channel = `CHANNEL_${sessionData.reservationId}_${sessionData.sessionNumber}_${Date.now()}`;

        const created = await prisma.session.create({
          data: {
            displayId,
            reservationId: sessionData.reservationId,
            channel,
            sessionNumber: sessionData.sessionNumber,
            startedAt: sessionData.startedAt,
            endedAt: sessionData.endedAt,
            duration: sessionData.duration,
            status: sessionData.status,
            transcript: sessionData.transcript || null,
            recordingUrl: sessionData.recordingUrl,
            attachments: sessionData.attachments || []
          }
        });

        // SessionNote 생성 (첫 번째 세션에 대한 노트)
        if (sessionData.sessionNumber === 1 && sessionData.transcript) {
          const reservation = reservations.find(r => r.id === sessionData.reservationId);
          if (reservation) {
            await prisma.sessionNote.create({
              data: {
                sessionId: created.id,
                userId: reservation.userId,
                content: `세션 ${sessionData.sessionNumber}: ${sessionData.transcript.substring(0, 100)}...`
              }
            });
          }
        }

        console.log(`Created session: ${created.displayId} - Session ${sessionData.sessionNumber} for reservation ${sessionData.reservationId}`);
        insertedCount++;

        // 요청 부하를 줄이기 위해 짧은 지연
        await new Promise(resolve => setTimeout(resolve, 100));

        if (insertedCount % 5 === 0) {
          console.log(`Inserted ${insertedCount} sessions...`);
        }
      } catch (error) {
        console.error(`Failed to create session for reservation ${sessionData.reservationId}:`, error.message);
      }
    }

    console.log('Consultation sessions data insertion completed!');

    // 최종 통계 확인
    const stats = await Promise.all([
      prisma.session.count(),
      prisma.session.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      prisma.sessionNote.count(),
      prisma.session.count({ where: { recordingUrl: { not: null } } }),
      prisma.session.aggregate({
        _avg: { duration: true },
        _sum: { duration: true }
      })
    ]);

    console.log(`\nFinal statistics:`);
    console.log(`Total sessions: ${stats[0]}`);
    console.log(`Status distribution:`);
    stats[1].forEach(stat => {
      console.log(`  ${stat.status}: ${stat._count.status} sessions`);
    });
    console.log(`Session notes: ${stats[2]}`);
    console.log(`Sessions with recordings: ${stats[3]}`);
    console.log(`Average session duration: ${Math.round(stats[4]._avg.duration || 0)} minutes`);
    console.log(`Total session time: ${stats[4]._sum.duration || 0} minutes`);

  } catch (error) {
    console.error('Error inserting consultation sessions data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertConsultationSessionsData();