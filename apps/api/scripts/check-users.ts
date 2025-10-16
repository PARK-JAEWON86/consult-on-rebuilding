import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  const userIds = [121, 122];

  console.log('🔍 Checking users in database...\n');

  for (const userId of userIds) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        expert: true,
        adminUser: true,
        reservations: true,
        reviews: true,
        communityPosts: true,
        chatSessions: true,
      },
    });

    if (user) {
      console.log(`❌ User ${userId} STILL EXISTS:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Is Expert: ${user.expert ? 'Yes (ID: ' + user.expert.id + ')' : 'No'}`);
      console.log(`   Is Admin: ${user.adminUser ? 'Yes' : 'No'}`);
      console.log(`   Reservations: ${user.reservations.length}`);
      console.log(`   Reviews: ${user.reviews.length}`);
      console.log(`   Community Posts: ${user.communityPosts.length}`);
      console.log(`   Chat Sessions: ${user.chatSessions.length}`);
      console.log('');
    } else {
      console.log(`✅ User ${userId} has been DELETED`);
      console.log('');
    }
  }
}

checkUsers()
  .catch((error) => {
    console.error('Error:', error);
  })
  .finally(() => prisma.$disconnect());
