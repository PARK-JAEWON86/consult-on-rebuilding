const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkExpertData() {
  try {
    const count = await prisma.expert.count();
    console.log('Expert count:', count);

    if (count > 0) {
      const samples = await prisma.expert.findMany({
        take: 3,
        select: {
          id: true,
          name: true,
          title: true,
          hourlyRate: true,
          ratePerMin: true,
          totalSessions: true,
          ratingAvg: true,
          reviewCount: true,
          consultationTypes: true,
          languages: true,
          experience: true,
          categories: true
        }
      });
      console.log('Sample expert data:');
      samples.forEach((expert, i) => {
        console.log(`${i+1}.`, JSON.stringify(expert, null, 2));
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExpertData();