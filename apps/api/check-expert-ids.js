const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkExpertIds() {
  try {
    const experts = await prisma.expert.findMany({
      select: {
        id: true,
        name: true,
        title: true,
        categories: true
      },
      orderBy: { id: 'asc' }
    });

    console.log('Expert ID mapping:');
    experts.forEach(expert => {
      const categories = JSON.parse(expert.categories);
      console.log(`ID: ${expert.id}, Name: ${expert.name}, Title: ${expert.title}, Categories: ${categories.join(',')}`);
    });

    // Check users too
    console.log('\nUser ID mapping for experts:');
    const users = await prisma.user.findMany({
      where: {
        roles: {
          path: '$[*]',
          array_contains: 'EXPERT'
        }
      },
      select: {
        id: true,
        name: true,
        roles: true
      },
      orderBy: { id: 'asc' }
    });

    users.forEach(user => {
      console.log(`User ID: ${user.id}, Name: ${user.name}, Roles: ${JSON.parse(user.roles).join(',')}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExpertIds();