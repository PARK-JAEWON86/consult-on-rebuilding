const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function insertCommunityData() {
  try {
    console.log('Creating community data dynamically without hardcoded values...');

    // 기존 데이터 확인
    const [existingPosts, existingComments, existingLikes] = await Promise.all([
      prisma.communityPost.count(),
      prisma.communityComment.count(),
      prisma.communityLike.count()
    ]);

    console.log(`Current community data: ${existingPosts} posts, ${existingComments} comments, ${existingLikes} likes`);

    // 기존 데이터 가져오기 (하드코딩 제거)
    const users = await prisma.user.findMany({
      select: { id: true, name: true, roles: true }
    });

    const experts = await prisma.expert.findMany({
      select: { id: true, name: true, specialty: true }
    });

    const categories = await prisma.category.findMany({
      select: { id: true, nameKo: true, slug: true }
    });

    const reservations = await prisma.reservation.findMany({
      where: { status: 'CONFIRMED' },
      select: { id: true, userId: true, expertId: true, note: true },
      orderBy: { id: 'asc' }
    });

    console.log(`Found ${users.length} users, ${experts.length} experts, ${categories.length} categories, ${reservations.length} reservations`);

    // 일반 사용자와 전문가 분리
    const clients = users.filter(user => {
      const roles = JSON.parse(user.roles);
      return roles.includes('USER');
    });

    const expertUsers = users.filter(user => {
      const roles = JSON.parse(user.roles);
      return roles.includes('EXPERT');
    });

    console.log(`${clients.length} clients and ${expertUsers.length} expert users`);

    // 1. 커뮤니티 게시글 생성 (하드코딩 제거)
    const communityPosts = [
      // 상담 후기 게시글들
      {
        userId: clients[0]?.id || users[0].id,
        categoryId: categories.find(c => c.slug.includes('psychology') || c.nameKo.includes('심리'))?.id || categories[0]?.id,
        title: '심리상담 후기 - 정말 도움이 되었어요!',
        content: '전문가님과의 상담이 정말 도움이 되었습니다. 스트레스 관리 방법을 구체적으로 알려주셔서 일상생활에 바로 적용할 수 있었어요. 특히 인지행동치료 기법이 효과적이었습니다.',
        postType: 'consultation_review',
        tags: ['심리상담', '후기', '스트레스관리', '인지행동치료'],
        attachments: ['counseling_photo.jpg'],
        consultationId: reservations[0]?.id,
        views: Math.floor(Math.random() * 50) + 20,
        likes: Math.floor(Math.random() * 15) + 5,
        comments: Math.floor(Math.random() * 5) + 1
      },
      {
        userId: clients[1]?.id || users[1].id,
        categoryId: categories.find(c => c.slug.includes('investment') || c.nameKo.includes('투자') || c.nameKo.includes('재무'))?.id || categories[1]?.id,
        title: '투자 조언 부탁드립니다',
        content: '현재 주식 투자를 시작하려고 하는데, 초보자에게 어떤 종목을 추천하시나요? 리스크 관리도 어떻게 해야 할지 궁금합니다.',
        postType: 'consultation_request',
        tags: ['투자', '주식', '초보자', '조언'],
        views: Math.floor(Math.random() * 30) + 10,
        likes: Math.floor(Math.random() * 10) + 2,
        comments: Math.floor(Math.random() * 4) + 1
      },
      {
        userId: clients[2]?.id || users[2].id,
        categoryId: categories.find(c => c.slug.includes('legal') || c.nameKo.includes('법률'))?.id || categories[2]?.id,
        title: '법률 상담 받고 싶어요',
        content: '부동산 계약 관련해서 문제가 생겼는데, 전문가님의 조언이 필요합니다. 급한 상황이라 빠른 상담 가능한지 문의드려요.',
        postType: 'consultation_request',
        tags: ['법률상담', '부동산', '계약', '긴급'],
        attachments: ['contract_document.pdf'],
        views: Math.floor(Math.random() * 25) + 10,
        likes: Math.floor(Math.random() * 8) + 1,
        comments: Math.floor(Math.random() * 3) + 1
      },
      // 전문가 소개 게시글들
      {
        userId: expertUsers[0]?.id || users[0].id,
        categoryId: categories[0]?.id,
        title: `안녕하세요, ${experts[0]?.specialty || '상담'} 전문가 ${expertUsers[0]?.name || '전문가'}입니다`,
        content: '다년간의 경력을 바탕으로 전문적이고 신뢰할 수 있는 상담을 제공합니다. 여러분의 고민과 문제 해결을 위해 최선을 다하겠습니다.',
        postType: 'expert_intro',
        tags: ['전문가소개', experts[0]?.specialty || '상담'],
        attachments: ['expert_certificate.pdf', 'expert_photo.jpg'],
        expertId: experts[0]?.id,
        views: Math.floor(Math.random() * 80) + 40,
        likes: Math.floor(Math.random() * 25) + 10,
        comments: Math.floor(Math.random() * 6) + 2
      },
      // 고정 게시글들
      {
        userId: users[0].id,
        categoryId: categories[0]?.id,
        title: '커뮤니티 이용 가이드',
        content: '커뮤니티를 효과적으로 이용하는 방법을 안내해드립니다. 게시글 작성 시 카테고리를 정확히 선택해주세요.',
        postType: 'general',
        isPinned: true,
        tags: ['가이드', '커뮤니티', '이용법'],
        attachments: ['community_guide.pdf'],
        views: Math.floor(Math.random() * 200) + 100,
        likes: Math.floor(Math.random() * 30) + 15,
        comments: Math.floor(Math.random() * 5) + 2
      },
      // 익명 게시글들
      {
        userId: clients[3]?.id || users[3].id,
        categoryId: categories[0]?.id,
        title: '익명으로 상담 후기 남겨요',
        content: '개인적인 사정으로 익명으로 후기를 남깁니다. 상담이 정말 도움이 되었어요.',
        postType: 'consultation_review',
        isAnonymous: true,
        tags: ['익명', '상담후기', '도움'],
        consultationId: reservations[1]?.id,
        views: Math.floor(Math.random() * 20) + 5,
        likes: Math.floor(Math.random() * 5) + 1,
        comments: Math.floor(Math.random() * 2) + 1
      }
    ];

    // 게시글 삽입
    const createdPosts = [];
    console.log(`Creating ${communityPosts.length} community posts...`);

    for (let i = 0; i < communityPosts.length; i++) {
      const postData = communityPosts[i];
      try {
        const post = await prisma.communityPost.create({
          data: {
            ...postData,
            publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // 최근 30일 내
          }
        });
        createdPosts.push(post);
        console.log(`Created post: ${post.id} - ${post.title}`);
      } catch (error) {
        console.error(`Failed to create post ${i + 1}:`, error.message);
      }
    }

    // 2. 댓글 생성 (동적으로)
    console.log('Creating community comments...');
    let createdComments = [];

    for (const post of createdPosts) {
      const numComments = Math.floor(Math.random() * 4) + 1; // 1-4개 댓글

      for (let i = 0; i < numComments; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const roles = JSON.parse(randomUser.roles);
        const isExpert = roles.includes('EXPERT');

        const commentContent = [
          '정말 좋은 정보 감사합니다!',
          '저도 비슷한 경험이 있어서 공감됩니다.',
          '전문적인 조언 정말 도움이 되었어요.',
          '궁금한 점이 있는데 추가로 상담 가능한가요?',
          '후기 공유해주셔서 감사해요!',
          '저도 상담 받아보고 싶어요.',
          '구체적인 방법을 알려주셔서 좋네요!'
        ][Math.floor(Math.random() * 7)];

        try {
          const comment = await prisma.communityComment.create({
            data: {
              postId: post.id,
              userId: randomUser.id,
              content: commentContent,
              likes: Math.floor(Math.random() * 5),
              expertSpecialty: isExpert ? experts.find(e => e.id === randomUser.id)?.specialty || null : null,
              expertLevel: isExpert ? 'expert' : null,
              expertExperience: isExpert ? Math.floor(Math.random() * 15) + 1 : null
            }
          });

          createdComments.push(comment);

          // 일부 댓글에 대댓글 추가
          if (Math.random() < 0.3) {
            const replyUser = users[Math.floor(Math.random() * users.length)];
            await prisma.communityComment.create({
              data: {
                postId: post.id,
                userId: replyUser.id,
                parentId: comment.id,
                content: '좋은 의견 감사합니다!',
                depth: 1,
                likes: Math.floor(Math.random() * 3)
              }
            });
          }
        } catch (error) {
          console.error(`Failed to create comment:`, error.message);
        }
      }
    }

    console.log(`Created ${createdComments.length} comments`);

    // 3. 좋아요 생성 (동적으로)
    console.log('Creating community likes...');
    let likeCount = 0;

    // 게시글 좋아요
    for (const post of createdPosts) {
      const numLikes = Math.floor(Math.random() * 20) + 5; // 5-25개 좋아요
      const likedUsers = users.sort(() => 0.5 - Math.random()).slice(0, numLikes);

      for (const user of likedUsers) {
        try {
          await prisma.communityLike.create({
            data: {
              userId: user.id,
              targetType: 'post',
              targetId: post.id
            }
          });
          likeCount++;
        } catch (error) {
          // 중복 좋아요는 무시
        }
      }
    }

    // 댓글 좋아요
    for (const comment of createdComments.slice(0, 20)) { // 일부 댓글만
      const numLikes = Math.floor(Math.random() * 5) + 1; // 1-5개 좋아요
      const likedUsers = users.sort(() => 0.5 - Math.random()).slice(0, numLikes);

      for (const user of likedUsers) {
        try {
          await prisma.communityLike.create({
            data: {
              userId: user.id,
              targetType: 'comment',
              targetId: comment.id
            }
          });
          likeCount++;
        } catch (error) {
          // 중복 좋아요는 무시
        }
      }
    }

    console.log(`Created ${likeCount} likes`);

    console.log('Community data insertion completed!');

    // 최종 통계 확인
    const stats = await Promise.all([
      prisma.communityPost.count(),
      prisma.communityComment.count(),
      prisma.communityLike.count(),
      prisma.communityPost.groupBy({
        by: ['postType'],
        _count: { postType: true }
      }),
      prisma.communityPost.count({ where: { isPinned: true } }),
      prisma.communityPost.count({ where: { isAnonymous: true } })
    ]);

    console.log(`\nFinal statistics:`);
    console.log(`Total posts: ${stats[0]}`);
    console.log(`Total comments: ${stats[1]}`);
    console.log(`Total likes: ${stats[2]}`);
    console.log(`Post types:`);
    stats[3].forEach(stat => {
      console.log(`  ${stat.postType}: ${stat._count.postType} posts`);
    });
    console.log(`Pinned posts: ${stats[4]}`);
    console.log(`Anonymous posts: ${stats[5]}`);

  } catch (error) {
    console.error('Error inserting community data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertCommunityData();