/**
 * Migration Script: Convert existing Expert availability data to ExpertAvailability records
 *
 * Purpose: Migrate existing approved experts who don't have ExpertAvailability records
 * Converts availabilityByDay format to ExpertAvailability table records
 *
 * Usage: npx tsx apps/api/scripts/migrate-existing-expert-availability.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface AvailabilitySlot {
  dayOfWeek: string
  startTime: string
  endTime: string
  isActive: boolean
}

/**
 * Convert availabilityByDay format to slots array
 * Input: { MONDAY: { available: true, hours: "09:00-12:00, 14:00-18:00" }, ... }
 * Output: [{ dayOfWeek: "MONDAY", startTime: "09:00", endTime: "12:00", isActive: true }, ...]
 */
function convertAvailabilityByDayToSlots(availability: any): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = []

  // Valid day keys
  const validDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

  for (const [day, data] of Object.entries(availability)) {
    // Skip non-day keys (like holidaySettings, availabilitySlots)
    if (!validDays.includes(day)) continue

    // Skip if data is not an object or doesn't have hours
    if (typeof data !== 'object' || data === null) continue

    const dayData = data as any

    // Skip if not available or no hours
    if (!dayData.available || !dayData.hours) continue

    // Parse hours string: "09:00-12:00, 14:00-18:00"
    const hours = dayData.hours as string
    const timeRanges = hours.split(',').map((s: string) => s.trim())

    for (const range of timeRanges) {
      // Skip empty ranges
      if (!range || !range.includes('-')) continue

      const [startTime, endTime] = range.split('-').map((t: string) => t.trim())

      // Validate time format (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        console.warn(`⚠️ Invalid time format: ${range} for ${day}`)
        continue
      }

      slots.push({
        dayOfWeek: day,
        startTime,
        endTime,
        isActive: true
      })
    }
  }

  return slots
}

async function migrateExistingExpertAvailability() {
  console.log('🚀 Starting migration of existing expert availability data...\n')

  try {
    // Step 1: Find all experts without ExpertAvailability records
    const expertsWithoutAvailability = await prisma.expert.findMany({
      where: {
        expertAvailability: { none: {} }
      },
      include: {
        expertAvailability: true
      }
    })

    console.log(`📊 Found ${expertsWithoutAvailability.length} experts without ExpertAvailability records\n`)

    if (expertsWithoutAvailability.length === 0) {
      console.log('✅ No migration needed - all experts have ExpertAvailability records')
      return
    }

    let migratedCount = 0
    let skippedCount = 0
    let errorCount = 0

    // Step 2: Process each expert
    for (const expert of expertsWithoutAvailability) {
      console.log(`\n🔄 Processing Expert ID: ${expert.id} (${expert.displayId})`)

      try {
        // Parse availability JSON
        const availability = expert.availability as any

        if (!availability || typeof availability !== 'object') {
          console.log(`  ⏭️ Skipped - No availability data`)
          skippedCount++
          continue
        }

        // Convert to slots
        const slots = convertAvailabilityByDayToSlots(availability)

        if (slots.length === 0) {
          console.log(`  ⏭️ Skipped - No valid time slots found`)
          skippedCount++
          continue
        }

        console.log(`  📋 Found ${slots.length} time slots:`)
        slots.forEach(slot => {
          console.log(`     - ${slot.dayOfWeek}: ${slot.startTime}-${slot.endTime}`)
        })

        // Step 3: Create ExpertAvailability records
        const result = await prisma.expertAvailability.createMany({
          data: slots.map(slot => ({
            expertId: expert.id,
            dayOfWeek: slot.dayOfWeek as any,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isActive: slot.isActive
          }))
        })

        console.log(`  ✅ Created ${result.count} ExpertAvailability records`)
        migratedCount++

      } catch (error) {
        console.error(`  ❌ Error processing expert ${expert.id}:`, error)
        errorCount++
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 Migration Summary:')
    console.log('='.repeat(60))
    console.log(`✅ Successfully migrated: ${migratedCount} experts`)
    console.log(`⏭️ Skipped (no data): ${skippedCount} experts`)
    console.log(`❌ Errors: ${errorCount} experts`)
    console.log(`📝 Total processed: ${expertsWithoutAvailability.length} experts`)
    console.log('='.repeat(60))

    if (migratedCount > 0) {
      console.log('\n✨ Migration completed successfully!')
      console.log('💡 Tip: Experts can now see their availability in edit mode')
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrateExistingExpertAvailability()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
