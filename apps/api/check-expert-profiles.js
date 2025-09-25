const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkExpertProfiles() {
  try {
    // expert_profiles 테이블 확인
    const count = await prisma.expertProfile.count();
    console.log('Expert profiles count:', count);

    if (count > 0) {
      const samples = await prisma.expertProfile.findMany({
        take: 3,
        select: {
          id: true,
          expertId: true,
          fullName: true,
          hourlyRate: true,
          pricePerMinute: true,
          totalSessions: true,
          avgRating: true,
          reviewCount: true,
          consultationTypes: true,
          languages: true
        }
      });
      console.log('Sample data:', samples);
    } else {
      console.log('No expert profiles found. Need to insert data.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExpertProfiles();