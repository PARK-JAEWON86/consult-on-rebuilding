import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteUsers(userIds: number[]) {
  console.log(`Starting deletion of users: ${userIds.join(', ')}`);

  for (const userId of userIds) {
    try {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          include: { expert: true, adminUser: true },
        });

        if (!user) {
          console.log(`User ${userId} not found, skipping...`);
          return;
        }

        console.log(`Deleting user ${userId} (${user.email})...`);

        // Delete expert-related records
        if (user.expert) {
          const expertId = user.expert.id;
          await tx.expertAvailability.deleteMany({ where: { expertId } });
          await tx.expertCategory.deleteMany({ where: { expertId } });
          await tx.review.deleteMany({ where: { expertId } });
          await tx.reservation.deleteMany({ where: { expertId } });
          await tx.expert.delete({ where: { id: expertId } });
        }

        // Delete user records
        await tx.review.deleteMany({ where: { userId } });
        await tx.reservation.deleteMany({ where: { userId } });
        await tx.communityLike.deleteMany({ where: { userId } });
        await tx.communityComment.deleteMany({ where: { userId } });
        await tx.communityPost.deleteMany({ where: { userId } });
        await tx.consultationSummary.deleteMany({ where: { createdBy: userId } });
        await tx.notification.deleteMany({ where: { userId } });
        await tx.paymentMethod.deleteMany({ where: { userId } });
        await tx.emailVerification.deleteMany({ where: { userId } });
        await tx.phoneVerification.deleteMany({ where: { userId } });
        await tx.aIUsage.deleteMany({ where: { userId } });
        await tx.chatSession.deleteMany({ where: { userId } });
        await tx.creditTransaction.deleteMany({ where: { userId } });
        await tx.expertApplication.deleteMany({ where: { userId } });

        if (user.adminUser) {
          await tx.adminUser.delete({ where: { userId } });
        }

        await tx.user.delete({ where: { id: userId } });
        console.log(`✅ Successfully deleted user ${userId}`);
      });
    } catch (error) {
      console.error(`❌ Error deleting user ${userId}:`, error);
      throw error;
    }
  }
}

deleteUsers([112, 113])
  .then(() => {
    console.log('✅ All users deleted successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Deletion failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
