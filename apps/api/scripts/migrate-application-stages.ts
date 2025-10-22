import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateApplicationStages() {
  console.log('🔄 Starting application stage migration...')
  console.log('='.repeat(60))

  try {
    // 1. 현재 데이터 현황 파악
    console.log('\n📊 Current Data Analysis:')
    const currentData = await prisma.$queryRaw<
      Array<{ status: string; currentStage: string | null; count: bigint }>
    >`
      SELECT status, currentStage, COUNT(*) as count
      FROM ExpertApplication
      GROUP BY status, currentStage
    `

    console.log('Status Distribution:')
    currentData.forEach((row) => {
      console.log(
        `  ${row.status.padEnd(30)} | ${(row.currentStage || 'NULL').padEnd(25)} | ${row.count} applications`
      )
    })

    // 2. PENDING이면서 이미 조회된 지원서 → DOCUMENT_REVIEW
    console.log('\n🔧 Step 1: Updating viewed PENDING applications...')
    const pendingViewedCount = await prisma.expertApplication.updateMany({
      where: {
        status: 'PENDING',
        currentStage: 'SUBMITTED',
        viewedByAdmin: true,
      },
      data: {
        currentStage: 'DOCUMENT_REVIEW',
      },
    })
    console.log(`  ✅ Updated ${pendingViewedCount.count} applications to DOCUMENT_REVIEW`)

    // 3. APPROVED 상태인데 currentStage가 APPROVED가 아닌 경우
    console.log('\n🔧 Step 2: Updating APPROVED applications...')
    const approvedCount = await prisma.expertApplication.updateMany({
      where: {
        status: 'APPROVED',
        currentStage: { not: 'APPROVED' },
      },
      data: {
        currentStage: 'APPROVED',
      },
    })
    console.log(`  ✅ Updated ${approvedCount.count} applications to APPROVED stage`)

    // 4. REJECTED 상태인데 currentStage가 REJECTED가 아닌 경우
    console.log('\n🔧 Step 3: Updating REJECTED applications...')
    const rejectedCount = await prisma.expertApplication.updateMany({
      where: {
        status: 'REJECTED',
        currentStage: { not: 'REJECTED' },
      },
      data: {
        currentStage: 'REJECTED',
      },
    })
    console.log(`  ✅ Updated ${rejectedCount.count} applications to REJECTED stage`)

    // 5. ADDITIONAL_INFO_REQUESTED 상태 업데이트
    console.log('\n🔧 Step 4: Updating ADDITIONAL_INFO_REQUESTED applications...')
    const additionalInfoCount = await prisma.expertApplication.updateMany({
      where: {
        status: 'ADDITIONAL_INFO_REQUESTED',
        currentStage: { not: 'ADDITIONAL_INFO_REQUESTED' },
      },
      data: {
        currentStage: 'ADDITIONAL_INFO_REQUESTED',
      },
    })
    console.log(`  ✅ Updated ${additionalInfoCount.count} applications`)

    // 6. currentStage가 null인 경우 SUBMITTED로 설정
    console.log('\n🔧 Step 5: Setting default currentStage for null values...')
    const nullStageCount = await prisma.expertApplication.updateMany({
      where: {
        currentStage: null,
      },
      data: {
        currentStage: 'SUBMITTED',
      },
    })
    console.log(`  ✅ Updated ${nullStageCount.count} applications with null currentStage`)

    // 7. 마이그레이션 후 데이터 현황
    console.log('\n📊 After Migration Data Analysis:')
    const afterData = await prisma.$queryRaw<
      Array<{ status: string; currentStage: string | null; count: bigint }>
    >`
      SELECT status, currentStage, COUNT(*) as count
      FROM ExpertApplication
      GROUP BY status, currentStage
      ORDER BY status, currentStage
    `

    console.log('Updated Status Distribution:')
    afterData.forEach((row) => {
      console.log(
        `  ${row.status.padEnd(30)} | ${(row.currentStage || 'NULL').padEnd(25)} | ${row.count} applications`
      )
    })

    console.log('\n' + '='.repeat(60))
    console.log('✅ Migration completed successfully!')

    // 8. 검증
    const inconsistencies = await prisma.expertApplication.findMany({
      where: {
        OR: [
          { status: 'APPROVED', currentStage: { not: 'APPROVED' } },
          { status: 'REJECTED', currentStage: { not: 'REJECTED' } },
          {
            status: 'ADDITIONAL_INFO_REQUESTED',
            currentStage: { not: 'ADDITIONAL_INFO_REQUESTED' },
          },
        ],
      },
      select: {
        id: true,
        displayId: true,
        status: true,
        currentStage: true,
      },
    })

    if (inconsistencies.length > 0) {
      console.log('\n⚠️ WARNING: Found inconsistencies after migration:')
      inconsistencies.forEach((app) => {
        console.log(
          `  ID ${app.id} (${app.displayId}): status=${app.status}, currentStage=${app.currentStage}`
        )
      })
    } else {
      console.log('\n✅ No inconsistencies found - migration successful!')
    }
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// 실행
migrateApplicationStages()
  .catch((error) => {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  })
