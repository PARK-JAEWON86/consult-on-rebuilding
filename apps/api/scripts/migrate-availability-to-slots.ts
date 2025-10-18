/**
 * 기존 Expert.availability JSON 데이터를 ExpertAvailability 테이블로 마이그레이션
 *
 * 사용법:
 * npx ts-node scripts/migrate-availability-to-slots.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 요일 매핑
const DAY_MAPPING: Record<string, string> = {
  'MONDAY': 'MONDAY',
  'TUESDAY': 'TUESDAY',
  'WEDNESDAY': 'WEDNESDAY',
  'THURSDAY': 'THURSDAY',
  'FRIDAY': 'FRIDAY',
  'SATURDAY': 'SATURDAY',
  'SUNDAY': 'SUNDAY',
  'monday': 'MONDAY',
  'tuesday': 'TUESDAY',
  'wednesday': 'WEDNESDAY',
  'thursday': 'THURSDAY',
  'friday': 'FRIDAY',
  'saturday': 'SATURDAY',
  'sunday': 'SUNDAY',
};

async function migrateAvailabilityToSlots() {
  try {
    console.log('🔍 Expert 테이블에서 availability 데이터가 있는 전문가 조회...\n');

    // 모든 전문가 조회
    const experts = await prisma.expert.findMany({
      select: {
        id: true,
        name: true,
        displayId: true,
        availability: true,
      },
    });

    console.log(`📊 전체 전문가 수: ${experts.length}\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const expert of experts) {
      console.log(`\n--- 전문가: ${expert.name} (${expert.displayId}) ---`);

      try {
        // 기존 availabilitySlots 조회
        const existingSlots = await prisma.expertAvailability.findMany({
          where: { expertId: expert.id },
        });

        if (existingSlots.length > 0) {
          console.log(`⏭️  이미 ${existingSlots.length}개의 슬롯 존재 - 건너뜀`);
          skippedCount++;
          continue;
        }

        // availability JSON 파싱
        const availability =
          typeof expert.availability === 'string'
            ? JSON.parse(expert.availability)
            : expert.availability;

        if (!availability || typeof availability !== 'object') {
          console.log('⏭️  availability 데이터 없음 - 건너뜀');
          skippedCount++;
          continue;
        }

        // availabilitySlots 생성
        const slotsToCreate: Array<{
          expertId: number;
          dayOfWeek: any; // ExpertDayOfWeek enum type
          startTime: string;
          endTime: string;
          isActive: boolean;
        }> = [];

        // availability 객체를 순회하며 슬롯 생성
        for (const [key, value] of Object.entries(availability)) {
          const dayKey = DAY_MAPPING[key];

          if (!dayKey) {
            // holidaySettings 같은 다른 키는 무시
            continue;
          }

          const dayData = value as any;

          if (!dayData || typeof dayData !== 'object') {
            continue;
          }

          const available = dayData.available === true;

          if (!available) {
            continue; // available이 false면 슬롯 생성하지 않음
          }

          // hours 파싱 (예: "09:00-18:00")
          const hours = dayData.hours || '09:00-18:00';
          const [startTime, endTime] = hours.split('-');

          if (startTime && endTime) {
            slotsToCreate.push({
              expertId: expert.id,
              dayOfWeek: dayKey,
              startTime: startTime.trim(),
              endTime: endTime.trim(),
              isActive: true,
            });
          }
        }

        if (slotsToCreate.length === 0) {
          console.log('⏭️  생성할 슬롯 없음 - 건너뜀');
          skippedCount++;
          continue;
        }

        // 슬롯 생성
        await prisma.expertAvailability.createMany({
          data: slotsToCreate,
          skipDuplicates: true,
        });

        console.log(`✅ ${slotsToCreate.length}개 슬롯 생성 완료`);
        console.log(
          `   생성된 슬롯: ${slotsToCreate.map((s) => `${s.dayOfWeek} ${s.startTime}-${s.endTime}`).join(', ')}`
        );
        migratedCount++;
      } catch (error: any) {
        console.error(`❌ 에러 발생:`, error.message);
        errorCount++;
      }
    }

    console.log('\n\n=== 마이그레이션 완료 ===');
    console.log(`✅ 성공: ${migratedCount}명`);
    console.log(`⏭️  건너뜀: ${skippedCount}명`);
    console.log(`❌ 실패: ${errorCount}명`);
    console.log(`📊 전체: ${experts.length}명`);
  } catch (error: any) {
    console.error('❌ 마이그레이션 실패:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 실행
migrateAvailabilityToSlots();
