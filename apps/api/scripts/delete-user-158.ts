import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteUser158() {
  const userId = 158;

  console.log(`🗑️  Starting deletion process for user ID: ${userId}`);

  try {
    // First, check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      console.log(`⚠️  User ID ${userId} not found`);
      return;
    }

    console.log(`📋 Found user: ${user.email} (${user.name})`);
    console.log(`\n📊 Counting related data...`);

    // Count all related data
    const expert = await prisma.expert.findUnique({
      where: { userId },
      select: { id: true }
    });
    const expertId = expert?.id;

    const counts = {
      expert: expertId ? 1 : 0,
      expertCategories: expertId ? await prisma.expertCategory.count({ where: { expertId } }) : 0,
      expertAvailability: expertId ? await prisma.expertAvailability.count({ where: { expertId } }) : 0,
      expertReviews: expertId ? await prisma.review.count({ where: { expertId } }) : 0,
      expertReservations: expertId ? await prisma.reservation.count({ where: { expertId } }) : 0,
      userReservations: await prisma.reservation.count({ where: { userId } }),
      userReviews: await prisma.review.count({ where: { userId } }),
      expertApplications: await prisma.expertApplication.count({ where: { userId } }),
      chatSessions: await prisma.chatSession.count({ where: { userId } }),
      communityComments: await prisma.communityComment.count({ where: { userId } }),
      communityLikes: await prisma.communityLike.count({ where: { userId } }),
      communityPosts: await prisma.communityPost.count({ where: { userId } }),
      notifications: await prisma.notification.count({ where: { userId } }),
      notificationSettings: await prisma.userNotificationSetting.count({ where: { userId } }),
      paymentMethods: await prisma.paymentMethod.count({ where: { userId } }),
      consultationSummaries: await prisma.consultationSummary.count({ where: { createdBy: userId } }),
      creditTransactions: await prisma.creditTransaction.count({ where: { userId } }),
      aiUsage: await prisma.aIUsage.count({ where: { userId } }),
      emailVerifications: await prisma.emailVerification.count({ where: { userId } }),
      phoneVerifications: await prisma.phoneVerification.count({ where: { userId } }),
      adminUser: await prisma.adminUser.count({ where: { userId } })
    };

    console.log(`\n📋 Data to be deleted:`);
    console.log(`   Expert profile: ${counts.expert}`);
    console.log(`   Expert categories: ${counts.expertCategories}`);
    console.log(`   Expert availability: ${counts.expertAvailability}`);
    console.log(`   Expert reviews: ${counts.expertReviews}`);
    console.log(`   Expert reservations: ${counts.expertReservations}`);
    console.log(`   User reservations: ${counts.userReservations}`);
    console.log(`   User reviews: ${counts.userReviews}`);
    console.log(`   Expert applications: ${counts.expertApplications}`);
    console.log(`   Chat sessions: ${counts.chatSessions}`);
    console.log(`   Community comments: ${counts.communityComments}`);
    console.log(`   Community likes: ${counts.communityLikes}`);
    console.log(`   Community posts: ${counts.communityPosts}`);
    console.log(`   Notifications: ${counts.notifications}`);
    console.log(`   Notification settings: ${counts.notificationSettings}`);
    console.log(`   Payment methods: ${counts.paymentMethods}`);
    console.log(`   Consultation summaries: ${counts.consultationSummaries}`);
    console.log(`   Credit transactions: ${counts.creditTransactions}`);
    console.log(`   AI usage records: ${counts.aiUsage}`);
    console.log(`   Email verifications: ${counts.emailVerifications}`);
    console.log(`   Phone verifications: ${counts.phoneVerifications}`);
    console.log(`   Admin user: ${counts.adminUser}`);

    console.log(`\n⚠️  Starting deletion in transaction...`);

    // Start transaction
    await prisma.$transaction(async (tx) => {
      // 1. Delete expert-related data first (if expert exists)
      if (expertId) {
        const deletedExpertCategories = await tx.expertCategory.deleteMany({
          where: { expertId }
        });
        console.log(`✅ Deleted ${deletedExpertCategories.count} expert category links`);

        const deletedAvailability = await tx.expertAvailability.deleteMany({
          where: { expertId }
        });
        console.log(`✅ Deleted ${deletedAvailability.count} expert availability slots`);

        const deletedExpertReviews = await tx.review.deleteMany({
          where: { expertId }
        });
        console.log(`✅ Deleted ${deletedExpertReviews.count} reviews for expert`);

        const expertReservations = await tx.reservation.findMany({
          where: { expertId },
          select: { id: true }
        });

        for (const reservation of expertReservations) {
          await tx.reservationHistory.deleteMany({
            where: { reservationId: reservation.id }
          });
        }

        const deletedExpertReservations = await tx.reservation.deleteMany({
          where: { expertId }
        });
        console.log(`✅ Deleted ${deletedExpertReservations.count} reservations for expert`);

        const deletedExpert = await tx.expert.delete({
          where: { id: expertId }
        });
        console.log(`✅ Deleted expert profile: ${deletedExpert.id}`);
      }

      // 2. Delete user's own reservations (as customer)
      const userReservations = await tx.reservation.findMany({
        where: { userId },
        select: { id: true }
      });

      for (const reservation of userReservations) {
        await tx.reservationHistory.deleteMany({
          where: { reservationId: reservation.id }
        });

        await tx.consultationSummary.deleteMany({
          where: { reservationId: reservation.id }
        });
      }

      const deletedUserReservations = await tx.reservation.deleteMany({
        where: { userId }
      });
      console.log(`✅ Deleted ${deletedUserReservations.count} reservations as customer`);

      const deletedUserReviews = await tx.review.deleteMany({
        where: { userId }
      });
      console.log(`✅ Deleted ${deletedUserReviews.count} reviews written by user`);

      const deletedApplications = await tx.expertApplication.deleteMany({
        where: { userId }
      });
      console.log(`✅ Deleted ${deletedApplications.count} expert applications`);

      const deletedChatSessions = await tx.chatSession.deleteMany({
        where: { userId }
      });
      console.log(`✅ Deleted ${deletedChatSessions.count} chat sessions`);

      const deletedCommunityComments = await tx.communityComment.deleteMany({
        where: { userId }
      });
      console.log(`✅ Deleted ${deletedCommunityComments.count} community comments`);

      const deletedCommunityLikes = await tx.communityLike.deleteMany({
        where: { userId }
      });
      console.log(`✅ Deleted ${deletedCommunityLikes.count} community likes`);

      const deletedCommunityPosts = await tx.communityPost.deleteMany({
        where: { userId }
      });
      console.log(`✅ Deleted ${deletedCommunityPosts.count} community posts`);

      const deletedNotifications = await tx.notification.deleteMany({
        where: { userId }
      });
      console.log(`✅ Deleted ${deletedNotifications.count} notifications`);

      const deletedNotificationSettings = await tx.userNotificationSetting.deleteMany({
        where: { userId }
      });
      console.log(`✅ Deleted ${deletedNotificationSettings.count} notification settings`);

      const deletedPaymentMethods = await tx.paymentMethod.deleteMany({
        where: { userId }
      });
      console.log(`✅ Deleted ${deletedPaymentMethods.count} payment methods`);

      const deletedConsultationSummaries = await tx.consultationSummary.deleteMany({
        where: { createdBy: userId }
      });
      console.log(`✅ Deleted ${deletedConsultationSummaries.count} consultation summaries`);

      const deletedCreditTransactions = await tx.creditTransaction.deleteMany({
        where: { userId }
      });
      console.log(`✅ Deleted ${deletedCreditTransactions.count} credit transactions`);

      const deletedAIUsage = await tx.aIUsage.deleteMany({
        where: { userId }
      });
      console.log(`✅ Deleted ${deletedAIUsage.count} AI usage records`);

      const deletedEmailVerifications = await tx.emailVerification.deleteMany({
        where: { userId }
      });
      console.log(`✅ Deleted ${deletedEmailVerifications.count} email verifications`);

      const deletedPhoneVerifications = await tx.phoneVerification.deleteMany({
        where: { userId }
      });
      console.log(`✅ Deleted ${deletedPhoneVerifications.count} phone verifications`);

      const deletedAdminUser = await tx.adminUser.deleteMany({
        where: { userId }
      });
      console.log(`✅ Deleted ${deletedAdminUser.count} admin user records`);

      const deletedUser = await tx.user.delete({
        where: { id: userId }
      });
      console.log(`✅ Deleted user: ${deletedUser.email}`);

      console.log(`\n🎉 Successfully deleted all data for user ID: ${userId}`);
    });

  } catch (error) {
    console.error('❌ Error deleting user data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteUser158()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
