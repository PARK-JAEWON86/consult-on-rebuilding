import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const application = await prisma.expertApplication.findFirst({
    where: { userId: 153 },
    select: { phoneNumber: true }
  })
  
  const expert = await prisma.expert.findFirst({
    where: { userId: 153 },
    select: { contactInfo: true }
  })
  
  console.log('=== APPLICATION phoneNumber ===')
  console.log(application?.phoneNumber)
  
  console.log('\n=== EXPERT contactInfo (before) ===')
  const currentContactInfo = typeof expert?.contactInfo === 'string'
    ? JSON.parse(expert.contactInfo)
    : expert?.contactInfo
  console.log(JSON.stringify(currentContactInfo, null, 2))
  
  if (application?.phoneNumber) {
    const updatedContactInfo = {
      ...currentContactInfo,
      phone: application.phoneNumber
    }
    
    await prisma.expert.updateMany({
      where: { userId: 153 },
      data: {
        contactInfo: updatedContactInfo
      }
    })
    
    console.log('\n✅ 업데이트 완료')
    
    const result = await prisma.expert.findFirst({
      where: { userId: 153 },
      select: { contactInfo: true }
    })
    
    console.log('\n=== EXPERT contactInfo (after) ===')
    const finalContactInfo = typeof result?.contactInfo === 'string'
      ? JSON.parse(result.contactInfo)
      : result?.contactInfo
    console.log(JSON.stringify(finalContactInfo, null, 2))
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
