import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const application = await prisma.expertApplication.findFirst({
    where: { userId: 153 },
    select: {
      certifications: true,
      portfolioImages: true,
    }
  })
  
  const expert = await prisma.expert.findFirst({
    where: { userId: 153 },
    select: {
      certifications: true,
      portfolioFiles: true,
      portfolioImages: true,
    }
  })
  
  console.log('=== APPLICATION ===')
  console.log('certifications:', JSON.stringify(application?.certifications, null, 2))
  console.log('portfolioImages:', JSON.stringify(application?.portfolioImages, null, 2))
  
  console.log('\n=== EXPERT ===')
  console.log('certifications:', JSON.stringify(expert?.certifications, null, 2))
  console.log('portfolioFiles:', JSON.stringify(expert?.portfolioFiles, null, 2))
  console.log('portfolioImages:', JSON.stringify(expert?.portfolioImages, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
