import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteUser128() {
  const userId = 128;

  console.log(`🗑️  Starting deletion process for user ID: ${userId}`);

  try {
    // Start transaction
    await prisma.$transaction(async (tx) => {
      // 1. Get expert ID if user is an expert
      const expert = await tx.expert.findUnique({
        where: { userId },
        select: { id: true }
      });

      const expertId = expert?.id;

      console.log(`📋 User ${userId} expert ID: ${expertId || 'N/A'}`);

      // 2. Delete expert-related data first (if expert exists)
      if (expertId) {
        // Delete ExpertCategory links
        const deletedExpertCategories = await tx.expertCategory.deleteMany({
          where: { expertId }
        });
        console.log(`✅ Deleted ${deletedExpertCategories.count} expert category links`);

        // Delete ExpertAvailability
        const deletedAvailability = await tx.expertAvailability.deleteMany({
          where: { expertId }
        });
        console.log(`✅ Deleted ${deletedAvailability.count} expert availability slots`);

        // Delete Reviews for this expert
        const deletedExpertReviews = await tx.review.deleteMany({
          where: { expertId }
        });
        console.log(`✅ Deleted ${deletedExpertReviews.count} reviews for expert`);

        // Delete Reservations for this expert (need to handle related data)
        const expertReservations = await tx.reservation.findMany({
          where: { expertId },
          select: { id: true }
        });

        for (const reservation of expertReservations) {
          // Delete ReservationHistory
          await tx.reservationHistory.deleteMany({
            where: { reservationId: reservation.id }
          });
        }

        const deletedExpertReservations = await tx.reservation.deleteMany({
          where: { expertId }
        });
        console.log(`✅ Deleted ${deletedExpertReservations.count} reservations for expert`);

        // Delete Expert profile
        const deletedExpert = await tx.expert.delete({
          where: { id: expertId }
        });
        console.log(`✅ Deleted expert profile: ${deletedExpert.id}`);
      }

      // 3. Delete user's own reservations (as customer)
      const userReservations = await tx.reservation.findMany({
        where: { userId },
        select: { id: true }
      });

      for (const reservation of userReservations) {
        // Delete ReservationHistory
        await tx.reservationHistory.deleteMany({
          where: { reservationId: reservation.id }
        });

        // Delete ConsultationSummary
        await tx.consultationSummary.deleteMany({
          where: { reservationId: reservation.id }
        });
      }

      const deletedUserReservations = await tx.reservation.deleteMany({
        where: { userId }
      });
      console.log(`✅ Deleted ${deletedUserReservations.count} reservations as customer`);

      // 4. Delete Reviews written by user
      const deletedUserReviews = await tx.review.deleteMany({
        where: { userId }
      });
      console.log(`✅ Deleted ${deletedUserReviews.count} reviews written by user`);

      // 5. Delete ExpertApplication
      const deletedApplications = await tx.expertApplication.deleteMany({
        where: { userId }
      });
      console.log(`✅ Deleted ${deletedApplications.count} expert applications`);

      // 6. Delete ChatSessions and ChatMessages (cascade should handle messages)
      const deletedChatSessions = await tx.chatSession.deleteMany({
        where: { userId }
      });
      console.log(`✅ Deleted ${deletedChatSessions.count} chat sessions`);

      // 7. Delete Community data
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

      // 8. Delete Notifications
      const deletedNotifications = await tx.notification.deleteMany({
        where: { userId }
      });
      console.log(`✅ Deleted ${deletedNotifications.count} notifications`);

      // 9. Delete NotificationSettings
      const deletedNotificationSettings = await tx.userNotificationSetting.deleteMany({
        where: { userId }
      });
      console.log(`✅ Deleted ${deletedNotificationSettings.count} notification settings`);

      // 10. Delete PaymentMethods
      const deletedPaymentMethods = await tx.paymentMethod.deleteMany({
        where: { userId }
      });
      console.log(`✅ Deleted ${deletedPaymentMethods.count} payment methods`);

      // 11. Delete ConsultationSummary created by user
      const deletedConsultationSummaries = await tx.consultationSummary.deleteMany({
        where: { createdBy: userId }
      });
      console.log(`✅ Deleted ${deletedConsultationSummaries.count} consultation summaries`);

      // 12. Delete CreditTransaction
      const deletedCreditTransactions = await tx.creditTransaction.deleteMany({
        where: { userId }
      });
      console.log(`✅ Deleted ${deletedCreditTransactions.count} credit transactions`);

      // 13. Delete AIUsage
      const deletedAIUsage = await tx.aIUsage.deleteMany({
        where: { userId }
      });
      console.log(`✅ Deleted ${deletedAIUsage.count} AI usage records`);

      // 14. Delete EmailVerification
      const deletedEmailVerifications = await tx.emailVerification.deleteMany({
        where: { userId }
      });
      console.log(`✅ Deleted ${deletedEmailVerifications.count} email verifications`);

      // 15. Delete PhoneVerification
      const deletedPhoneVerifications = await tx.phoneVerification.deleteMany({
        where: { userId }
      });
      console.log(`✅ Deleted ${deletedPhoneVerifications.count} phone verifications`);

      // 16. Delete AdminUser (if exists)
      const deletedAdminUser = await tx.adminUser.deleteMany({
        where: { userId }
      });
      console.log(`✅ Deleted ${deletedAdminUser.count} admin user records`);

      // 17. Finally, delete the User
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

// Run the script
deleteUser128()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
