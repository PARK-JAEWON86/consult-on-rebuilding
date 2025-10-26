const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

console.log('✅ Checking Prisma Client models...\n');
console.log('Has inquiry?', 'inquiry' in prisma);

const models = Object.keys(prisma).filter(k =>
  k[0] !== '_' &&
  k[0] === k[0].toLowerCase() &&
  typeof prisma[k] === 'object'
);

console.log('\n📋 Available models:', models.join(', '));
console.log('\n✅ Check complete!');

prisma.$disconnect();
