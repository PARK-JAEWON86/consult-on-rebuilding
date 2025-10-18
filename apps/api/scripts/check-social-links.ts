import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAllFields() {
  try {
    console.log('🔍 전문가 신청 데이터의 모든 필드 확인...\n')

    const applications = await prisma.expertApplication.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3 // 최근 3개만 확인
    })

    if (applications.length === 0) {
      console.log('❌ 전문가 신청 데이터가 없습니다.')
      return
    }

    for (const app of applications) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`📋 신청 ID: ${app.id}`)
      console.log(`👤 이름: ${app.name}`)
      console.log(`📧 이메일: ${app.email}`)
      console.log(`📅 신청일: ${app.createdAt}`)
      console.log(`📊 상태: ${app.status}`)
      console.log('')

      // 1. 전화번호
      console.log('📞 전화번호 (phoneNumber):')
      console.log(`   타입: ${typeof app.phoneNumber}`)
      console.log(`   값: ${app.phoneNumber || 'null'}`)
      console.log('')

      // 2. 자격증 (certifications)
      console.log('🎓 자격증 (certifications):')
      console.log(`   타입: ${typeof app.certifications}`)
      if (app.certifications) {
        try {
          const parsed = typeof app.certifications === 'string'
            ? JSON.parse(app.certifications as string)
            : app.certifications
          console.log(`   파싱 결과:`, JSON.stringify(parsed, null, 2))
          console.log(`   Array 여부: ${Array.isArray(parsed)}`)
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log(`   첫 번째 항목:`, parsed[0])
            console.log(`   year 필드 있음: ${parsed[0].hasOwnProperty('year')}`)
            console.log(`   year 값: ${parsed[0].year || 'undefined'}`)
          }
        } catch (e) {
          console.log(`   ❌ 파싱 실패:`, e)
        }
      } else {
        console.log(`   ⚠️  null 또는 undefined`)
      }
      console.log('')

      // 3. 소셜링크 (socialLinks)
      console.log('🔗 소셜링크 (socialLinks):')
      console.log(`   타입: ${typeof app.socialLinks}`)
      if (app.socialLinks) {
        try {
          const parsed = typeof app.socialLinks === 'string'
            ? JSON.parse(app.socialLinks as string)
            : app.socialLinks
          console.log(`   파싱 결과:`, parsed)
          console.log(`   파싱 타입: ${typeof parsed}`)
          console.log(`   Array 여부: ${Array.isArray(parsed)}`)
        } catch (e) {
          console.log(`   ❌ 파싱 실패:`, e)
        }
      } else {
        console.log(`   ⚠️  null 또는 undefined`)
      }
      console.log('')

      // 4. 포트폴리오 이미지 (portfolioImages)
      console.log('🖼️  포트폴리오 이미지 (portfolioImages):')
      console.log(`   타입: ${typeof app.portfolioImages}`)
      if (app.portfolioImages) {
        try {
          const parsed = typeof app.portfolioImages === 'string'
            ? JSON.parse(app.portfolioImages as string)
            : app.portfolioImages
          console.log(`   파싱 타입: ${typeof parsed}`)
          console.log(`   Array 여부: ${Array.isArray(parsed)}`)
          if (Array.isArray(parsed)) {
            console.log(`   이미지 개수: ${parsed.length}`)
            if (parsed.length > 0) {
              console.log(`   첫 번째 이미지 길이: ${parsed[0]?.length || 0} chars`)
            }
          }
        } catch (e) {
          console.log(`   ❌ 파싱 실패:`, e)
        }
      } else {
        console.log(`   ⚠️  null 또는 undefined`)
      }
      console.log('')

      // 5. 프로필 이미지
      console.log('📸 프로필 이미지 (profileImage):')
      console.log(`   타입: ${typeof app.profileImage}`)
      console.log(`   있음: ${app.profileImage ? 'YES' : 'NO'}`)
      if (app.profileImage) {
        console.log(`   길이: ${app.profileImage.length} chars`)
      }
      console.log('')

      // 6. 예약 가능 시간 (availability)
      console.log('📅 예약 가능 시간 (availability):')
      console.log(`   타입: ${typeof app.availability}`)
      if (app.availability) {
        try {
          const parsed = typeof app.availability === 'string'
            ? JSON.parse(app.availability as string)
            : app.availability
          console.log(`   파싱 타입: ${typeof parsed}`)
          console.log(`   Array 여부: ${Array.isArray(parsed)}`)
          console.log(`   키 목록:`, Object.keys(parsed))
          console.log(`   첫 3개 키 값:`,
            Object.keys(parsed).slice(0, 3).map(key => `${key}: ${JSON.stringify(parsed[key])}`).join(', ')
          )
        } catch (e) {
          console.log(`   ❌ 파싱 실패:`, e)
        }
      } else {
        console.log(`   ⚠️  null 또는 undefined`)
      }
      console.log('')
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  } catch (error) {
    console.error('❌ 오류 발생:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAllFields()
