import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Check users with admin role
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { roles: { path: '$', array_contains: 'admin' } },
      ]
    },
    include: {
      adminUser: true
    },
    take: 10
  })
  
  console.log('Users with admin role:')
  console.log(JSON.stringify(users, null, 2))
  
  // Check all AdminUser records
  const adminUsers = await prisma.adminUser.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          roles: true
        }
      }
    }
  })
  
  console.log('\nAdminUser records:')
  console.log(JSON.stringify(adminUsers, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
