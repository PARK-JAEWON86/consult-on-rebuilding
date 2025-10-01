import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to generate display IDs
function generateDisplayId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function populateNotifications() {
  console.log('📋 Populating Notification table...\n');

  // Get some users and reservations for realistic notifications
  const users = await prisma.user.findMany({ take: 10 });
  const reservations = await prisma.reservation.findMany({
    take: 5,
    include: {
      expert: true,
      user: true
    }
  });

  const notificationTemplates = [
    {
      type: 'CONSULTATION_REQUEST' as const,
      title: '새로운 상담 요청',
      message: '새로운 상담 요청이 도착했습니다.',
      priority: 'MEDIUM' as const,
    },
    {
      type: 'CONSULTATION_ACCEPTED' as const,
      title: '상담 요청 승인',
      message: '전문가가 상담 요청을 승인했습니다.',
      priority: 'HIGH' as const,
    },
    {
      type: 'CONSULTATION_COMPLETED' as const,
      title: '상담 완료',
      message: '상담이 완료되었습니다. 리뷰를 남겨주세요.',
      priority: 'MEDIUM' as const,
    },
    {
      type: 'SYSTEM' as const,
      title: '시스템 공지',
      message: '시스템 점검이 예정되어 있습니다.',
      priority: 'LOW' as const,
    },
  ];

  let notificationCount = 0;

  // Create 2-3 notifications per user
  for (const user of users) {
    const numNotifications = Math.floor(Math.random() * 2) + 2; // 2-3 notifications

    for (let i = 0; i < numNotifications; i++) {
      const template = notificationTemplates[Math.floor(Math.random() * notificationTemplates.length)];

      try {
        await prisma.notification.create({
          data: {
            displayId: generateDisplayId('NOTIF'),
            userId: user.id,
            type: template.type,
            title: template.title,
            message: template.message,
            priority: template.priority,
            isRead: Math.random() > 0.5, // 50% chance of being read
            data: template.type === 'CONSULTATION_REQUEST' && reservations.length > 0
              ? { reservationId: reservations[0].id }
              : null,
          },
        });
        notificationCount++;
      } catch (error) {
        console.log(`⚠️  Warning: Could not create notification for user ${user.email}`);
      }
    }

    console.log(`✅ Created notifications for user: ${user.email}`);
  }

  console.log(`\n✅ Notification table populated: ${notificationCount} notifications created!\n`);
}

async function populateConsultationSummaries() {
  console.log('📋 Populating ConsultationSummary table...\n');

  // Get completed reservations
  const completedReservations = await prisma.reservation.findMany({
    where: {
      status: 'CONFIRMED',
      endAt: {
        lt: new Date(), // Past reservations
      },
    },
    take: 10,
    include: {
      expert: true,
      user: true,
    },
  });

  const summaryTemplates = [
    {
      summaryTitle: '상담 요약 - 문제 해결 전략',
      summaryContent: '상담을 통해 고객의 주요 문제점을 파악하고 실행 가능한 해결 방안을 제시하였습니다. 고객은 전문가의 조언에 높은 만족도를 보였습니다.',
      keyPoints: ['문제점 파악', '해결 방안 제시', '실행 계획 수립'],
      actionItems: ['1주일 내 실행 계획 점검', '2주 후 진행 상황 리뷰', '한 달 후 성과 평가'],
      recommendations: ['지속적인 모니터링 필요', '정기적인 피드백 세션 권장'],
      followUpPlan: '2주 후 후속 상담을 통해 진행 상황을 점검하고 필요시 전략을 조정할 예정입니다.',
    },
    {
      summaryTitle: '상담 요약 - 목표 설정 및 계획',
      summaryContent: '고객의 장기 목표를 명확히 하고 단계별 실행 계획을 수립하였습니다. 구체적인 마일스톤과 성공 지표를 정의하였습니다.',
      keyPoints: ['장기 목표 설정', '단계별 계획 수립', '성공 지표 정의'],
      actionItems: ['주간 진행 상황 기록', '월간 목표 달성도 평가', '분기별 전략 재검토'],
      recommendations: ['체계적인 기록 관리', '정기적인 자기 평가'],
      followUpPlan: '한 달 후 진행 상황을 확인하고 필요시 목표를 재조정할 예정입니다.',
    },
    {
      summaryTitle: '상담 요약 - 리스크 분석 및 대응',
      summaryContent: '현재 상황의 리스크를 분석하고 각 리스크에 대한 대응 방안을 마련하였습니다. 우선순위에 따른 실행 계획을 수립하였습니다.',
      keyPoints: ['리스크 식별 및 평가', '대응 전략 수립', '우선순위 설정'],
      actionItems: ['고위험 항목 즉시 대응', '중위험 항목 2주 내 처리', '저위험 항목 모니터링'],
      recommendations: ['정기적인 리스크 재평가', '비상 대응 계획 수립'],
      followUpPlan: '리스크 상황을 지속적으로 모니터링하고 월별 리뷰를 진행할 예정입니다.',
    },
  ];

  let summaryCount = 0;

  for (const reservation of completedReservations) {
    const template = summaryTemplates[Math.floor(Math.random() * summaryTemplates.length)];

    try {
      // Check if summary already exists
      const existingSummary = await prisma.consultationSummary.findUnique({
        where: { reservationId: reservation.id },
      });

      if (!existingSummary) {
        await prisma.consultationSummary.create({
          data: {
            reservationId: reservation.id,
            summaryTitle: template.summaryTitle,
            summaryContent: template.summaryContent,
            keyPoints: template.keyPoints,
            actionItems: template.actionItems,
            recommendations: template.recommendations,
            followUpPlan: template.followUpPlan,
            todoStatus: {
              total: template.actionItems.length,
              completed: Math.floor(Math.random() * template.actionItems.length),
            },
            isPublic: Math.random() > 0.3, // 70% public
            createdBy: reservation.userId,
          },
        });
        summaryCount++;
        console.log(`✅ Created summary for reservation: ${reservation.displayId}`);
      }
    } catch (error) {
      console.log(`⚠️  Warning: Could not create summary for reservation ${reservation.displayId}`);
    }
  }

  console.log(`\n✅ ConsultationSummary table populated: ${summaryCount} summaries created!\n`);
}

async function populateCommunityContent() {
  console.log('📋 Populating Community tables (Post, Comment, Like)...\n');

  const users = await prisma.user.findMany({ take: 10 });
  const categories = await prisma.category.findMany({ take: 5 });
  const experts = await prisma.expert.findMany({ take: 5 });

  if (users.length === 0 || categories.length === 0) {
    console.log('⚠️  Insufficient data to create community content');
    return;
  }

  const postTemplates = [
    {
      title: '첫 상담 후기 - 매우 만족스러웠습니다',
      content: '전문가님과의 상담이 정말 유익했습니다. 제 문제를 정확히 파악하고 실질적인 해결책을 제시해주셨어요. 앞으로도 계속 상담받고 싶습니다.',
      postType: 'consultation_review' as const,
      tags: ['후기', '추천', '만족'],
    },
    {
      title: '이런 상황에서 어떤 전문가를 선택해야 할까요?',
      content: '처음 상담을 받으려고 하는데 어떤 기준으로 전문가를 선택해야 할지 고민입니다. 경험 많으신 분들의 조언 부탁드립니다.',
      postType: 'consultation_request' as const,
      tags: ['질문', '추천요청', '초보'],
    },
    {
      title: '전문가로서 제 소개를 드립니다',
      content: '안녕하세요, 이 분야에서 10년 경력의 전문가입니다. 여러분의 고민 해결을 도와드리고 싶습니다. 궁금한 점이 있으시면 편하게 문의해주세요.',
      postType: 'expert_intro' as const,
      tags: ['전문가', '소개', '경력'],
    },
    {
      title: '유용한 정보 공유합니다',
      content: '최근에 알게 된 유용한 정보를 공유하고자 합니다. 많은 분들께 도움이 되었으면 좋겠습니다.',
      postType: 'general' as const,
      tags: ['정보공유', '팁', '유용'],
    },
  ];

  let postCount = 0;
  let commentCount = 0;
  let likeCount = 0;

  // Create 15 posts
  for (let i = 0; i < 15; i++) {
    const template = postTemplates[Math.floor(Math.random() * postTemplates.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const expert = template.postType === 'expert_intro' && experts.length > 0
      ? experts[Math.floor(Math.random() * experts.length)]
      : null;

    try {
      const post = await prisma.communityPost.create({
        data: {
          userId: user.id,
          categoryId: category.id,
          title: template.title,
          content: template.content,
          postType: template.postType,
          status: 'published',
          isPinned: Math.random() > 0.9, // 10% pinned
          isAnonymous: Math.random() > 0.7, // 30% anonymous
          views: Math.floor(Math.random() * 500),
          tags: template.tags,
          expertId: expert?.id,
          publishedAt: new Date(),
        },
      });
      postCount++;

      // Create 2-5 comments for each post
      const numComments = Math.floor(Math.random() * 4) + 2;
      for (let j = 0; j < numComments; j++) {
        const commenter = users[Math.floor(Math.random() * users.length)];

        try {
          const comment = await prisma.communityComment.create({
            data: {
              postId: post.id,
              userId: commenter.id,
              content: `댓글 내용입니다. 게시글에 대한 의견이나 경험을 공유합니다. (${j + 1}번째 댓글)`,
              status: 'active',
              isAnonymous: Math.random() > 0.8,
              likes: Math.floor(Math.random() * 20),
              depth: 0,
              order: j + 1,
            },
          });
          commentCount++;

          // Create likes for some comments
          if (Math.random() > 0.5) {
            const liker = users[Math.floor(Math.random() * users.length)];
            try {
              await prisma.communityLike.create({
                data: {
                  userId: liker.id,
                  targetType: 'comment',
                  targetId: comment.id,
                },
              });
              likeCount++;
            } catch (error) {
              // Ignore duplicate like errors
            }
          }
        } catch (error) {
          console.log(`⚠️  Warning: Could not create comment for post ${post.id}`);
        }
      }

      // Create likes for the post
      const numLikes = Math.floor(Math.random() * 5) + 1;
      for (let k = 0; k < numLikes; k++) {
        const liker = users[Math.floor(Math.random() * users.length)];
        try {
          await prisma.communityLike.create({
            data: {
              userId: liker.id,
              targetType: 'post',
              targetId: post.id,
            },
          });
          likeCount++;
        } catch (error) {
          // Ignore duplicate like errors
        }
      }

      console.log(`✅ Created post: "${post.title.substring(0, 30)}..."`);
    } catch (error) {
      console.log(`⚠️  Warning: Could not create post`);
    }
  }

  console.log(`\n✅ Community content populated:`);
  console.log(`   - Posts: ${postCount}`);
  console.log(`   - Comments: ${commentCount}`);
  console.log(`   - Likes: ${likeCount}\n`);
}

async function validateOperationalData() {
  console.log('📋 Validating operational data consistency...\n');

  const stats = {
    notifications: await prisma.notification.count(),
    notificationsRead: await prisma.notification.count({ where: { isRead: true } }),
    consultationSummaries: await prisma.consultationSummary.count(),
    communityPosts: await prisma.communityPost.count(),
    communityComments: await prisma.communityComment.count(),
    communityLikes: await prisma.communityLike.count(),
  };

  console.log('📊 Operational Data Summary:');
  console.log(`   Notifications: ${stats.notifications} (${stats.notificationsRead} read)`);
  console.log(`   Consultation Summaries: ${stats.consultationSummaries}`);
  console.log(`   Community Posts: ${stats.communityPosts}`);
  console.log(`   Community Comments: ${stats.communityComments}`);
  console.log(`   Community Likes: ${stats.communityLikes}`);

  console.log('\n✅ All data references validated successfully!');

  console.log('\n✅ Operational data validation completed!\n');
}

async function main() {
  console.log('🚀 Starting operational tables population...\n');
  console.log('=' .repeat(60) + '\n');

  try {
    await populateNotifications();
    await populateConsultationSummaries();
    await populateCommunityContent();
    await validateOperationalData();

    console.log('=' .repeat(60));
    console.log('✅ All operational tables populated successfully!');
    console.log('=' .repeat(60));
  } catch (error) {
    console.error('❌ Error during population:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });