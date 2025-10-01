import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function validateDataConsistency() {
  console.log('🔍 Comprehensive Data Consistency Validation\n');
  console.log('=' .repeat(70) + '\n');

  let totalIssues = 0;
  const checks: { name: string; status: string; details?: string }[] = [];

  // ============================================================
  // 1. CATEGORY & EXPERT CATEGORY VALIDATION
  // ============================================================
  console.log('📋 1. Category & ExpertCategory Validation\n');

  // Check: All categories have at least one expert
  const categoriesWithExperts = await prisma.category.findMany({
    include: {
      _count: {
        select: { expertLinks: true },
      },
    },
  });

  let categoriesWithoutExperts = 0;
  categoriesWithExperts.forEach(cat => {
    if (cat._count.expertLinks === 0) {
      console.log(`   ⚠️  Category "${cat.nameKo}" has no experts`);
      categoriesWithoutExperts++;
    }
  });

  if (categoriesWithoutExperts === 0) {
    checks.push({ name: 'All categories have experts', status: '✅' });
    console.log('   ✅ All categories have at least one expert\n');
  } else {
    checks.push({
      name: 'All categories have experts',
      status: '⚠️ ',
      details: `${categoriesWithoutExperts} categories without experts`
    });
    totalIssues += categoriesWithoutExperts;
    console.log(`   ⚠️  ${categoriesWithoutExperts} categories without experts\n`);
  }

  // Check: All experts have at least one category
  const expertsWithCategories = await prisma.expert.findMany({
    include: {
      _count: {
        select: { categoryLinks: true },
      },
    },
  });

  const expertsWithoutCategories = expertsWithCategories.filter(
    expert => expert._count.categoryLinks === 0
  );

  if (expertsWithoutCategories.length === 0) {
    checks.push({ name: 'All experts have categories', status: '✅' });
    console.log('   ✅ All experts have at least one category\n');
  } else {
    checks.push({
      name: 'All experts have categories',
      status: '⚠️ ',
      details: `${expertsWithoutCategories.length} experts without categories`
    });
    totalIssues += expertsWithoutCategories.length;
    expertsWithoutCategories.forEach(expert => {
      console.log(`   ⚠️  Expert "${expert.name}" has no categories`);
    });
    console.log();
  }

  // Check: ExpertCategory referential integrity
  const expertCategoryLinks = await prisma.expertCategory.findMany({
    include: {
      expert: true,
      category: true,
    },
  });

  const brokenLinks = expertCategoryLinks.filter(
    link => !link.expert || !link.category
  );

  if (brokenLinks.length === 0) {
    checks.push({ name: 'ExpertCategory referential integrity', status: '✅' });
    console.log('   ✅ All ExpertCategory links are valid\n');
  } else {
    checks.push({
      name: 'ExpertCategory referential integrity',
      status: '❌',
      details: `${brokenLinks.length} broken links`
    });
    totalIssues += brokenLinks.length;
    console.log(`   ❌ ${brokenLinks.length} broken ExpertCategory links\n`);
  }

  // ============================================================
  // 2. EXPERT AVAILABILITY VALIDATION
  // ============================================================
  console.log('📋 2. Expert Availability Validation\n');

  // Check: All active experts have availability
  const activeExpertsWithoutAvailability = await prisma.expert.findMany({
    where: {
      isActive: true,
      availabilitySlots: {
        none: {},
      },
    },
    select: { id: true, name: true },
  });

  if (activeExpertsWithoutAvailability.length === 0) {
    checks.push({ name: 'Active experts have availability', status: '✅' });
    console.log('   ✅ All active experts have availability slots\n');
  } else {
    checks.push({
      name: 'Active experts have availability',
      status: '⚠️ ',
      details: `${activeExpertsWithoutAvailability.length} active experts without availability`
    });
    totalIssues += activeExpertsWithoutAvailability.length;
    activeExpertsWithoutAvailability.forEach(expert => {
      console.log(`   ⚠️  Active expert "${expert.name}" has no availability`);
    });
    console.log();
  }

  // Check: Availability slot time consistency
  const availabilitySlots = await prisma.expertAvailability.findMany();

  let invalidTimeSlots = 0;
  availabilitySlots.forEach(slot => {
    const [startHour, startMin] = slot.startTime.split(':').map(Number);
    const [endHour, endMin] = slot.endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes >= endMinutes) {
      console.log(`   ⚠️  Invalid time slot: ${slot.startTime} - ${slot.endTime}`);
      invalidTimeSlots++;
    }
  });

  if (invalidTimeSlots === 0) {
    checks.push({ name: 'Availability time slots valid', status: '✅' });
    console.log('   ✅ All availability time slots are valid\n');
  } else {
    checks.push({
      name: 'Availability time slots valid',
      status: '⚠️ ',
      details: `${invalidTimeSlots} invalid time slots`
    });
    totalIssues += invalidTimeSlots;
    console.log();
  }

  // ============================================================
  // 3. NOTIFICATION VALIDATION
  // ============================================================
  console.log('📋 3. Notification Validation\n');

  // Check: All notifications reference valid users (using include to validate)
  const notificationsWithUsers = await prisma.notification.findMany({
    include: {
      user: true,
    },
  });

  const notificationsWithInvalidUser = notificationsWithUsers.filter(n => !n.user);

  if (notificationsWithInvalidUser.length === 0) {
    checks.push({ name: 'Notification user references', status: '✅' });
    console.log('   ✅ All notifications reference valid users\n');
  } else {
    checks.push({
      name: 'Notification user references',
      status: '❌',
      details: `${notificationsWithInvalidUser.length} orphaned notifications`
    });
    totalIssues += notificationsWithInvalidUser.length;
    console.log(`   ❌ ${notificationsWithInvalidUser.length} orphaned notifications\n`);
  }

  // ============================================================
  // 4. CONSULTATION SUMMARY VALIDATION
  // ============================================================
  console.log('📋 4. Consultation Summary Validation\n');

  // Check: All summaries reference valid reservations
  const summaries = await prisma.consultationSummary.findMany({
    include: {
      creator: true,
    },
  });

  const summariesWithInvalidCreator = summaries.filter(s => !s.creator);

  if (summariesWithInvalidCreator.length === 0) {
    checks.push({ name: 'Summary creator references', status: '✅' });
    console.log('   ✅ All summaries reference valid creators\n');
  } else {
    checks.push({
      name: 'Summary creator references',
      status: '❌',
      details: `${summariesWithInvalidCreator.length} summaries with invalid creators`
    });
    totalIssues += summariesWithInvalidCreator.length;
    console.log(`   ❌ ${summariesWithInvalidCreator.length} summaries with invalid creators\n`);
  }

  // ============================================================
  // 5. COMMUNITY DATA VALIDATION
  // ============================================================
  console.log('📋 5. Community Data Validation\n');

  // Check: All posts reference valid users and categories
  const posts = await prisma.communityPost.findMany({
    include: {
      user: true,
      category: true,
    },
  });

  const postsWithInvalidUser = posts.filter(p => !p.user);
  const postsWithInvalidCategory = posts.filter(p => !p.category);

  if (postsWithInvalidUser.length === 0) {
    checks.push({ name: 'Post user references', status: '✅' });
    console.log('   ✅ All posts reference valid users');
  } else {
    checks.push({
      name: 'Post user references',
      status: '❌',
      details: `${postsWithInvalidUser.length} posts with invalid users`
    });
    totalIssues += postsWithInvalidUser.length;
    console.log(`   ❌ ${postsWithInvalidUser.length} posts with invalid users`);
  }

  if (postsWithInvalidCategory.length === 0) {
    checks.push({ name: 'Post category references', status: '✅' });
    console.log('   ✅ All posts reference valid categories\n');
  } else {
    checks.push({
      name: 'Post category references',
      status: '❌',
      details: `${postsWithInvalidCategory.length} posts with invalid categories`
    });
    totalIssues += postsWithInvalidCategory.length;
    console.log(`   ❌ ${postsWithInvalidCategory.length} posts with invalid categories\n`);
  }

  // Check: All comments reference valid posts and users
  const comments = await prisma.communityComment.findMany({
    include: {
      post: true,
      user: true,
    },
  });

  const commentsWithInvalidPost = comments.filter(c => !c.post);
  const commentsWithInvalidUser = comments.filter(c => !c.user);

  if (commentsWithInvalidPost.length === 0 && commentsWithInvalidUser.length === 0) {
    checks.push({ name: 'Comment references', status: '✅' });
    console.log('   ✅ All comments reference valid posts and users\n');
  } else {
    if (commentsWithInvalidPost.length > 0) {
      checks.push({
        name: 'Comment post references',
        status: '❌',
        details: `${commentsWithInvalidPost.length} comments with invalid posts`
      });
      totalIssues += commentsWithInvalidPost.length;
      console.log(`   ❌ ${commentsWithInvalidPost.length} comments with invalid posts`);
    }
    if (commentsWithInvalidUser.length > 0) {
      checks.push({
        name: 'Comment user references',
        status: '❌',
        details: `${commentsWithInvalidUser.length} comments with invalid users`
      });
      totalIssues += commentsWithInvalidUser.length;
      console.log(`   ❌ ${commentsWithInvalidUser.length} comments with invalid users`);
    }
    console.log();
  }

  // Check: All likes reference valid users
  const likes = await prisma.communityLike.findMany({
    include: {
      user: true,
    },
  });

  const likesWithInvalidUser = likes.filter(l => !l.user);

  if (likesWithInvalidUser.length === 0) {
    checks.push({ name: 'Like user references', status: '✅' });
    console.log('   ✅ All likes reference valid users\n');
  } else {
    checks.push({
      name: 'Like user references',
      status: '❌',
      details: `${likesWithInvalidUser.length} likes with invalid users`
    });
    totalIssues += likesWithInvalidUser.length;
    console.log(`   ❌ ${likesWithInvalidUser.length} likes with invalid users\n`);
  }

  // ============================================================
  // 6. DATA STATISTICS SUMMARY
  // ============================================================
  console.log('=' .repeat(70));
  console.log('\n📊 Final Data Statistics\n');

  const stats = {
    users: await prisma.user.count(),
    experts: await prisma.expert.count(),
    categories: await prisma.category.count(),
    expertCategoryLinks: await prisma.expertCategory.count(),
    availabilitySlots: await prisma.expertAvailability.count(),
    reservations: await prisma.reservation.count(),
    reviews: await prisma.review.count(),
    notifications: await prisma.notification.count(),
    consultationSummaries: await prisma.consultationSummary.count(),
    communityPosts: await prisma.communityPost.count(),
    communityComments: await prisma.communityComment.count(),
    communityLikes: await prisma.communityLike.count(),
  };

  console.log('Core Data:');
  console.log(`   Users:                      ${stats.users}`);
  console.log(`   Experts:                    ${stats.experts}`);
  console.log(`   Categories:                 ${stats.categories}`);
  console.log(`   Expert-Category Links:      ${stats.expertCategoryLinks}`);
  console.log(`   Availability Slots:         ${stats.availabilitySlots}`);
  console.log();

  console.log('Transactional Data:');
  console.log(`   Reservations:               ${stats.reservations}`);
  console.log(`   Reviews:                    ${stats.reviews}`);
  console.log(`   Notifications:              ${stats.notifications}`);
  console.log(`   Consultation Summaries:     ${stats.consultationSummaries}`);
  console.log();

  console.log('Community Data:');
  console.log(`   Posts:                      ${stats.communityPosts}`);
  console.log(`   Comments:                   ${stats.communityComments}`);
  console.log(`   Likes:                      ${stats.communityLikes}`);
  console.log();

  console.log('Calculated Metrics:');
  console.log(`   Avg Categories per Expert:  ${(stats.expertCategoryLinks / stats.experts).toFixed(2)}`);
  console.log(`   Avg Slots per Expert:       ${(stats.availabilitySlots / stats.experts).toFixed(2)}`);
  console.log(`   Avg Comments per Post:      ${(stats.communityComments / stats.communityPosts).toFixed(2)}`);
  console.log(`   Avg Likes per Post:         ${(stats.communityLikes / stats.communityPosts).toFixed(2)}`);
  console.log();

  // ============================================================
  // 7. VALIDATION SUMMARY
  // ============================================================
  console.log('=' .repeat(70));
  console.log('\n🎯 Validation Summary\n');

  console.log('Validation Checks:');
  checks.forEach(check => {
    const details = check.details ? ` (${check.details})` : '';
    console.log(`   ${check.status} ${check.name}${details}`);
  });
  console.log();

  if (totalIssues === 0) {
    console.log('✅ ALL VALIDATION CHECKS PASSED!');
    console.log('✅ Data consistency is excellent!');
  } else {
    console.log(`⚠️  Found ${totalIssues} potential issues`);
    console.log('⚠️  Review the issues above and fix as needed');
  }

  console.log('\n' + '=' .repeat(70));
}

async function main() {
  try {
    await validateDataConsistency();
  } catch (error) {
    console.error('❌ Error during validation:', error);
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