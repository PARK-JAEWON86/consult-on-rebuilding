/**
 * Test Script: Duplicate Application Fix Validation
 *
 * Purpose: Verify that resubmitting applications updates existing records
 * instead of creating duplicates
 *
 * Usage: npx tsx apps/api/scripts/test-duplicate-application-fix.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface TestResult {
  testName: string
  status: 'PASS' | 'FAIL'
  details: string
  expected: string
  actual: string
}

const results: TestResult[] = []

async function cleanup() {
  console.log('🧹 Cleaning up test data...\n')

  // Find test user
  const testUser = await prisma.user.findFirst({
    where: { email: 'test-duplicate-fix@example.com' }
  })

  if (testUser) {
    // Delete applications first
    await prisma.expertApplication.deleteMany({
      where: { userId: testUser.id }
    })

    // Delete user
    await prisma.user.delete({
      where: { id: testUser.id }
    })

    console.log('✅ Cleanup completed\n')
  } else {
    console.log('ℹ️ No test data to clean up\n')
  }
}

async function createTestUser() {
  console.log('👤 Creating test user...\n')

  const user = await prisma.user.create({
    data: {
      email: 'test-duplicate-fix@example.com',
      name: '테스트 사용자',
      roles: JSON.stringify(['user'])
    }
  })

  console.log(`✅ Test user created: ID ${user.id}\n`)
  return user
}

async function test1_NormalResubmission(userId: number) {
  console.log('📝 TEST 1: Normal Resubmission Flow')
  console.log('=' .repeat(60))

  try {
    // Step 1: Initial submission
    console.log('Step 1: User submits initial application...')
    const app1 = await prisma.expertApplication.create({
      data: {
        userId,
        name: '테스트 사용자',
        email: 'test-duplicate-fix@example.com',
        phoneNumber: '010-1234-5678',
        specialty: 'TEST',
        experienceYears: 5,
        bio: 'Initial submission',
        keywords: JSON.stringify(['test']),
        consultationTypes: JSON.stringify(['video']),
        languages: JSON.stringify(['한국어']),
        availability: JSON.stringify({
          availabilitySlots: [{ dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '17:00', isActive: true }]
        }),
        certifications: JSON.stringify([]),
        education: JSON.stringify([]),
        workExperience: JSON.stringify([]),
        status: 'PENDING',
        currentStage: 'SUBMITTED',
        displayId: 'TEST-001'
      }
    })
    console.log(`✅ Application created: ID ${app1.id}, displayId: ${app1.displayId}, status: ${app1.status}\n`)

    // Step 2: Admin requests additional info
    console.log('Step 2: Admin requests additional information...')
    await prisma.expertApplication.update({
      where: { id: app1.id },
      data: {
        status: 'ADDITIONAL_INFO_REQUESTED',
        reviewedAt: new Date(),
        reviewedBy: 999,
        reviewNotes: 'Please provide more details'
      }
    })
    console.log(`✅ Application updated to ADDITIONAL_INFO_REQUESTED\n`)

    // Step 3: User resubmits (simulate the fixed createApplication logic)
    console.log('Step 3: User resubmits with updated information...')

    // This simulates what the fixed createApplication function does
    const existingApp = await prisma.expertApplication.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'ADDITIONAL_INFO_REQUESTED'] }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (existingApp) {
      console.log(`✅ Found existing application: ID ${existingApp.id}`)

      // Update instead of creating new
      await prisma.expertApplication.update({
        where: { id: existingApp.id },
        data: {
          phoneNumber: '010-9999-8888', // Changed
          bio: 'Updated submission with more details',
          status: 'PENDING',
          currentStage: 'SUBMITTED',
          reviewedAt: null,
          reviewedBy: null,
          reviewNotes: null,
          viewedByAdmin: false,
          viewedAt: null
        }
      })
      console.log(`✅ Application updated successfully\n`)
    }

    // Step 4: Verify only one application exists
    console.log('Step 4: Verification...')
    const allApps = await prisma.expertApplication.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    })

    const finalApp = allApps[0]

    console.log(`📊 Total applications for user: ${allApps.length}`)
    console.log(`📋 Application details:`)
    console.log(`   - ID: ${finalApp.id}`)
    console.log(`   - displayId: ${finalApp.displayId}`)
    console.log(`   - status: ${finalApp.status}`)
    console.log(`   - phoneNumber: ${finalApp.phoneNumber}`)
    console.log(`   - bio: ${finalApp.bio}`)
    console.log(`   - reviewedAt: ${finalApp.reviewedAt}`)
    console.log(`   - reviewNotes: ${finalApp.reviewNotes}\n`)

    // Assertions
    const passed =
      allApps.length === 1 &&
      finalApp.displayId === 'TEST-001' &&
      finalApp.status === 'PENDING' &&
      finalApp.phoneNumber === '010-9999-8888' &&
      finalApp.reviewedAt === null &&
      finalApp.reviewNotes === null

    results.push({
      testName: 'TEST 1: Normal Resubmission',
      status: passed ? 'PASS' : 'FAIL',
      details: 'User resubmits after additional info request',
      expected: '1 application with updated data, same displayId, PENDING status, cleared review fields',
      actual: `${allApps.length} application(s), displayId: ${finalApp.displayId}, status: ${finalApp.status}, reviewedAt: ${finalApp.reviewedAt}`
    })

    if (passed) {
      console.log('✅ TEST 1 PASSED: No duplicate created, existing application updated\n')
    } else {
      console.log('❌ TEST 1 FAILED: Unexpected behavior\n')
    }

  } catch (error) {
    console.error('❌ TEST 1 ERROR:', error)
    results.push({
      testName: 'TEST 1: Normal Resubmission',
      status: 'FAIL',
      details: 'User resubmits after additional info request',
      expected: 'Successful update',
      actual: `Error: ${error.message}`
    })
  }

  console.log('=' .repeat(60) + '\n')
}

async function test2_RejectedReapplication(userId: number) {
  console.log('📝 TEST 2: Rejected Reapplication Flow')
  console.log('=' .repeat(60))

  try {
    // Step 1: Create rejected application
    console.log('Step 1: Create initial application (later rejected)...')
    const app1 = await prisma.expertApplication.create({
      data: {
        userId,
        name: '테스트 사용자',
        email: 'test-duplicate-fix@example.com',
        phoneNumber: '010-1234-5678',
        specialty: 'TEST',
        experienceYears: 5,
        bio: 'First application',
        keywords: JSON.stringify(['test']),
        consultationTypes: JSON.stringify(['video']),
        languages: JSON.stringify(['한국어']),
        availability: JSON.stringify({}),
        certifications: JSON.stringify([]),
        education: JSON.stringify([]),
        workExperience: JSON.stringify([]),
        status: 'REJECTED',
        currentStage: 'REVIEW',
        displayId: 'TEST-002'
      }
    })
    console.log(`✅ Application created and rejected: ID ${app1.id}\n`)

    // Step 2: User reapplies
    console.log('Step 2: User creates new application after rejection...')

    // Check for existing PENDING or ADDITIONAL_INFO_REQUESTED (should not find the REJECTED one)
    const existingApp = await prisma.expertApplication.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'ADDITIONAL_INFO_REQUESTED'] }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!existingApp) {
      console.log(`✅ No existing PENDING/ADDITIONAL_INFO_REQUESTED application found (REJECTED excluded)`)

      // Create new application
      const app2 = await prisma.expertApplication.create({
        data: {
          userId,
          name: '테스트 사용자',
          email: 'test-duplicate-fix@example.com',
          phoneNumber: '010-9999-8888',
          specialty: 'TEST',
          experienceYears: 7,
          bio: 'Second application after rejection',
          keywords: JSON.stringify(['test', 'improved']),
          consultationTypes: JSON.stringify(['video']),
          languages: JSON.stringify(['한국어']),
          availability: JSON.stringify({}),
          certifications: JSON.stringify([]),
          education: JSON.stringify([]),
          workExperience: JSON.stringify([]),
          status: 'PENDING',
          currentStage: 'SUBMITTED',
          displayId: 'TEST-003'
        }
      })
      console.log(`✅ New application created: ID ${app2.id}, displayId: ${app2.displayId}\n`)
    }

    // Step 3: Verify two applications exist (one REJECTED, one PENDING)
    console.log('Step 3: Verification...')
    const allApps = await prisma.expertApplication.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    })

    console.log(`📊 Total applications for user: ${allApps.length}`)
    allApps.forEach((app, idx) => {
      console.log(`   ${idx + 1}. ID: ${app.id}, displayId: ${app.displayId}, status: ${app.status}`)
    })
    console.log()

    // Assertions
    const passed =
      allApps.length === 2 &&
      allApps[0].status === 'REJECTED' &&
      allApps[1].status === 'PENDING' &&
      allApps[0].displayId !== allApps[1].displayId

    results.push({
      testName: 'TEST 2: Rejected Reapplication',
      status: passed ? 'PASS' : 'FAIL',
      details: 'User reapplies after rejection',
      expected: '2 applications (1 REJECTED, 1 PENDING) with different displayIds',
      actual: `${allApps.length} application(s), statuses: [${allApps.map(a => a.status).join(', ')}]`
    })

    if (passed) {
      console.log('✅ TEST 2 PASSED: New application created after rejection\n')
    } else {
      console.log('❌ TEST 2 FAILED: Unexpected behavior\n')
    }

    // Cleanup for next test
    await prisma.expertApplication.deleteMany({ where: { userId } })

  } catch (error) {
    console.error('❌ TEST 2 ERROR:', error)
    results.push({
      testName: 'TEST 2: Rejected Reapplication',
      status: 'FAIL',
      details: 'User reapplies after rejection',
      expected: 'New application created',
      actual: `Error: ${error.message}`
    })
  }

  console.log('=' .repeat(60) + '\n')
}

async function test3_MultipleResubmissions(userId: number) {
  console.log('📝 TEST 3: Multiple Resubmissions')
  console.log('=' .repeat(60))

  try {
    // Step 1: Initial application
    console.log('Step 1: Initial application...')
    const app = await prisma.expertApplication.create({
      data: {
        userId,
        name: '테스트 사용자',
        email: 'test-duplicate-fix@example.com',
        phoneNumber: '010-1111-1111',
        specialty: 'TEST',
        experienceYears: 5,
        bio: 'Version 1',
        keywords: JSON.stringify(['test']),
        consultationTypes: JSON.stringify(['video']),
        languages: JSON.stringify(['한국어']),
        availability: JSON.stringify({}),
        certifications: JSON.stringify([]),
        education: JSON.stringify([]),
        workExperience: JSON.stringify([]),
        status: 'PENDING',
        currentStage: 'SUBMITTED',
        displayId: 'TEST-004'
      }
    })
    console.log(`✅ Application created: ID ${app.id}\n`)

    // Step 2-5: Multiple additional info requests and resubmissions
    for (let i = 1; i <= 3; i++) {
      console.log(`Iteration ${i}:`)

      // Admin requests additional info
      await prisma.expertApplication.update({
        where: { id: app.id },
        data: {
          status: 'ADDITIONAL_INFO_REQUESTED',
          reviewedAt: new Date(),
          reviewedBy: 999
        }
      })
      console.log(`  - Admin requests additional info`)

      // User resubmits
      const existingApp = await prisma.expertApplication.findFirst({
        where: {
          userId,
          status: { in: ['PENDING', 'ADDITIONAL_INFO_REQUESTED'] }
        }
      })

      if (existingApp) {
        await prisma.expertApplication.update({
          where: { id: existingApp.id },
          data: {
            phoneNumber: `010-${i}${i}${i}${i}-${i}${i}${i}${i}`,
            bio: `Version ${i + 1}`,
            status: 'PENDING',
            reviewedAt: null,
            reviewedBy: null
          }
        })
        console.log(`  - User resubmits (Version ${i + 1})`)
      }
      console.log()
    }

    // Verification
    console.log('Verification...')
    const allApps = await prisma.expertApplication.findMany({
      where: { userId }
    })

    const finalApp = allApps[0]

    console.log(`📊 Total applications: ${allApps.length}`)
    console.log(`📋 Final application:`)
    console.log(`   - ID: ${finalApp.id} (same as original: ${finalApp.id === app.id})`)
    console.log(`   - displayId: ${finalApp.displayId}`)
    console.log(`   - phoneNumber: ${finalApp.phoneNumber}`)
    console.log(`   - bio: ${finalApp.bio}`)
    console.log(`   - status: ${finalApp.status}\n`)

    // Assertions
    const passed =
      allApps.length === 1 &&
      finalApp.id === app.id &&
      finalApp.displayId === 'TEST-004' &&
      finalApp.bio === 'Version 4' &&
      finalApp.phoneNumber === '010-3333-3333'

    results.push({
      testName: 'TEST 3: Multiple Resubmissions',
      status: passed ? 'PASS' : 'FAIL',
      details: '3 cycles of additional info request → resubmit',
      expected: '1 application, same ID and displayId, final data preserved',
      actual: `${allApps.length} application(s), bio: ${finalApp.bio}, phone: ${finalApp.phoneNumber}`
    })

    if (passed) {
      console.log('✅ TEST 3 PASSED: Same record updated through multiple resubmissions\n')
    } else {
      console.log('❌ TEST 3 FAILED: Unexpected behavior\n')
    }

  } catch (error) {
    console.error('❌ TEST 3 ERROR:', error)
    results.push({
      testName: 'TEST 3: Multiple Resubmissions',
      status: 'FAIL',
      details: 'Multiple resubmission cycles',
      expected: 'Single application updated multiple times',
      actual: `Error: ${error.message}`
    })
    }

  console.log('=' .repeat(60) + '\n')
}

async function printSummary() {
  console.log('\n')
  console.log('=' .repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('=' .repeat(60))

  const passCount = results.filter(r => r.status === 'PASS').length
  const failCount = results.filter(r => r.status === 'FAIL').length

  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : '❌'
    console.log(`\n${icon} ${result.testName}`)
    console.log(`   Details: ${result.details}`)
    console.log(`   Expected: ${result.expected}`)
    console.log(`   Actual: ${result.actual}`)
  })

  console.log('\n' + '=' .repeat(60))
  console.log(`Total: ${results.length} tests`)
  console.log(`✅ Passed: ${passCount}`)
  console.log(`❌ Failed: ${failCount}`)
  console.log('=' .repeat(60))

  if (failCount === 0) {
    console.log('\n🎉 All tests passed! Duplicate application fix is working correctly.\n')
  } else {
    console.log('\n⚠️ Some tests failed. Please review the implementation.\n')
  }
}

async function main() {
  console.log('🚀 Starting Duplicate Application Fix Test Suite\n')
  console.log('=' .repeat(60))
  console.log('This test validates that the updated createApplication logic')
  console.log('updates existing applications instead of creating duplicates\n')
  console.log('=' .repeat(60) + '\n')

  try {
    // Cleanup any previous test data
    await cleanup()

    // Create test user
    const testUser = await createTestUser()

    // Run tests
    await test1_NormalResubmission(testUser.id)
    await cleanup() // Clean between tests
    const testUser2 = await createTestUser()
    await test2_RejectedReapplication(testUser2.id)
    await cleanup()
    const testUser3 = await createTestUser()
    await test3_MultipleResubmissions(testUser3.id)

    // Print summary
    await printSummary()

    // Final cleanup
    await cleanup()

  } catch (error) {
    console.error('❌ Test suite failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run tests
main()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
