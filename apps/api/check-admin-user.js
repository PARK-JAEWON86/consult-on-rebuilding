const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAdminUser() {
  try {
    const adminUser = await prisma.user.findUnique({
      where: { email: 'consult.on.official@gmail.com' },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        provider: true,
        createdAt: true
      }
    });

    if (adminUser) {
      console.log('✅ Admin user found:');
      console.log('ID:', adminUser.id);
      console.log('Email:', adminUser.email);
      console.log('Name:', adminUser.name);
      console.log('Roles:', adminUser.roles);
      console.log('Provider:', adminUser.provider);
      console.log('Is Admin?', Array.isArray(adminUser.roles) && adminUser.roles.includes('ADMIN'));
    } else {
      console.log('❌ Admin user not found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUser();