/**
 * Cleanup Script: Merge Existing Duplicate Applications
 *
 * Purpose: Clean up duplicate expert applications that were created before the fix
 *
 * Strategy:
 * - Find users with multiple PENDING or ADDITIONAL_INFO_REQUESTED applications
 * - Keep the latest application (most recent createdAt)
 * - Delete or mark older duplicates as CANCELLED
 *
 * Usage:
 * - Dry-run (preview only): pnpm --filter @consulton/api exec tsx scripts/cleanup-duplicate-applications.ts
 * - Execute cleanup: pnpm --filter @consulton/api exec tsx scripts/cleanup-duplicate-applications.ts --execute
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Parse command line arguments
const args = process.argv.slice(2)
const EXECUTE_MODE = args.includes('--execute')
const DELETE_OLD = args.includes('--delete') // Otherwise mark as CANCELLED

interface DuplicateGroup {
  userId: number
  userName: string
  userEmail: string
  applications: Array<{
    id: number
    displayId: string
    status: string
    createdAt: Date
    updatedAt: Date
  }>
}

async function findDuplicateApplications(): Promise<DuplicateGroup[]> {
  console.log('🔍 Searching for duplicate applications...\n')

  // Find all expert applications with active status
  const applications = await prisma.expertApplication.findMany({
    where: {
      status: { in: ['PENDING', 'ADDITIONAL_INFO_REQUESTED'] }
    }
  })

  // Group by userId and sort by createdAt desc within each group
  const groupedByUser = new Map<number, typeof applications>()

  for (const app of applications) {
    if (!groupedByUser.has(app.userId)) {
      groupedByUser.set(app.userId, [])
    }
    groupedByUser.get(app.userId)!.push(app)
  }

  // Sort each group by createdAt (descending - latest first)
  for (const apps of groupedByUser.values()) {
    apps.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  // Find users with duplicates
  const duplicates: DuplicateGroup[] = []

  for (const [userId, apps] of groupedByUser.entries()) {
    if (apps.length > 1) {
      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (user) {
        duplicates.push({
          userId: user.id,
          userName: user.name || 'Unknown',
          userEmail: user.email,
          applications: apps.map(app => ({
            id: app.id,
            displayId: app.displayId,
            status: app.status,
            createdAt: app.createdAt,
            updatedAt: app.updatedAt
          }))
        })
      }
    }
  }

  return duplicates
}

async function previewCleanup(duplicates: DuplicateGroup[]) {
  console.log('=' .repeat(70))
  console.log('📋 DUPLICATE APPLICATIONS FOUND')
  console.log('=' .repeat(70))

  if (duplicates.length === 0) {
    console.log('\n✅ No duplicate applications found!\n')
    return
  }

  console.log(`\nTotal users with duplicates: ${duplicates.length}\n`)

  duplicates.forEach((dup, index) => {
    console.log(`\n${index + 1}. User: ${dup.userName} (${dup.userEmail})`)
    console.log(`   User ID: ${dup.userId}`)
    console.log(`   Applications: ${dup.applications.length}`)
    console.log()

    dup.applications.forEach((app, appIndex) => {
      const isLatest = appIndex === 0
      const action = isLatest ? '✅ KEEP' : (DELETE_OLD ? '🗑️ DELETE' : '🚫 CANCEL')

      console.log(`   ${action} Application ${appIndex + 1}:`)
      console.log(`      - ID: ${app.id}`)
      console.log(`      - Display ID: ${app.displayId}`)
      console.log(`      - Status: ${app.status}`)
      console.log(`      - Created: ${app.createdAt.toISOString()}`)
      console.log(`      - Updated: ${app.updatedAt.toISOString()}`)
      console.log()
    })

    console.log('   ' + '-'.repeat(66))
  })

  console.log('\n' + '='.repeat(70))
  console.log('📊 SUMMARY')
  console.log('='.repeat(70))

  const totalApps = duplicates.reduce((sum, dup) => sum + dup.applications.length, 0)
  const toKeep = duplicates.length
  const toRemove = totalApps - toKeep

  console.log(`Total applications: ${totalApps}`)
  console.log(`To keep (latest): ${toKeep}`)
  console.log(`To ${DELETE_OLD ? 'delete' : 'cancel'}: ${toRemove}`)
  console.log('='.repeat(70))
}

async function executeCleanup(duplicates: DuplicateGroup[]) {
  console.log('\n🚀 Starting cleanup...\n')

  let successCount = 0
  let errorCount = 0

  for (const dup of duplicates) {
    console.log(`Processing user: ${dup.userName} (${dup.userEmail})`)

    // Keep the first (latest) application, process the rest
    const [latest, ...oldOnes] = dup.applications

    console.log(`  ✅ Keeping: ${latest.displayId} (ID: ${latest.id})`)

    for (const oldApp of oldOnes) {
      try {
        if (DELETE_OLD) {
          // Delete old application
          await prisma.expertApplication.delete({
            where: { id: oldApp.id }
          })
          console.log(`  🗑️ Deleted: ${oldApp.displayId} (ID: ${oldApp.id})`)
        } else {
          // Mark as CANCELLED
          await prisma.expertApplication.update({
            where: { id: oldApp.id },
            data: {
              status: 'CANCELLED',
              reviewNotes: 'Automatically cancelled - duplicate application (older version merged)'
            }
          })
          console.log(`  🚫 Cancelled: ${oldApp.displayId} (ID: ${oldApp.id})`)
        }
        successCount++
      } catch (error) {
        console.error(`  ❌ Failed to process ${oldApp.displayId}:`, error.message)
        errorCount++
      }
    }
    console.log()
  }

  console.log('=' .repeat(70))
  console.log('📊 CLEANUP RESULTS')
  console.log('=' .repeat(70))
  console.log(`✅ Successfully processed: ${successCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log('=' .repeat(70))
}

async function main() {
  console.log('\n🧹 Expert Application Duplicate Cleanup Script\n')
  console.log('=' .repeat(70))

  if (EXECUTE_MODE) {
    console.log('⚠️  EXECUTE MODE: Changes will be made to the database!')
    console.log(`Action: ${DELETE_OLD ? 'DELETE old applications' : 'MARK old applications as CANCELLED'}`)
  } else {
    console.log('ℹ️  DRY-RUN MODE: No changes will be made (preview only)')
    console.log('   To execute cleanup, add --execute flag')
    console.log('   To delete instead of cancel, add --delete flag')
  }

  console.log('=' .repeat(70) + '\n')

  try {
    // Find duplicates
    const duplicates = await findDuplicateApplications()

    // Preview
    await previewCleanup(duplicates)

    if (duplicates.length === 0) {
      console.log('✨ Database is clean! No action needed.\n')
      return
    }

    // Execute if in execute mode
    if (EXECUTE_MODE) {
      console.log('\n⚠️  WARNING: This will modify the database!')
      console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n')

      // Wait 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000))

      await executeCleanup(duplicates)

      console.log('\n✅ Cleanup completed successfully!\n')
    } else {
      console.log('\nℹ️  This was a dry-run. No changes were made.')
      console.log('To execute cleanup, run:')
      console.log('  pnpm --filter @consulton/api exec tsx scripts/cleanup-duplicate-applications.ts --execute')
      console.log('\nTo delete old applications instead of marking cancelled:')
      console.log('  pnpm --filter @consulton/api exec tsx scripts/cleanup-duplicate-applications.ts --execute --delete\n')
    }

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
