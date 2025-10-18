/**
 * 박재원 전문가의 availability 데이터를 Application에서 Expert로 복사하고
 * availabilitySlots를 생성합니다
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixJaewonAvailability() {
  try {
    console.log('🔍 박재원 전문가 찾기...\n');

    // 1. Expert 찾기
    const expert = await prisma.expert.findFirst({
      where: { name: { contains: '재원' } }
    });

    if (!expert) {
      console.log('❌ 박재원 전문가를 찾을 수 없습니다.');
      return;
    }

    console.log(`✅ Expert 찾음: ${expert.name} (${expert.displayId})`);
    console.log(`   Expert ID: ${expert.id}\n`);

    // 2. 해당 유저의 Application 찾기
    const application = await prisma.expertApplication.findFirst({
      where: expert.userId ? { userId: expert.userId } : { name: { contains: '재원' } },
      orderBy: { createdAt: 'desc' }
    });

    if (!application) {
      console.log('❌ 연결된 Application을 찾을 수 없습니다.');
      return;
    }

    console.log(`✅ Application 찾음: ID ${application.id}`);
    console.log(`   상태: ${application.status}\n`);

    // 3. Application의 availability 확인
    const appAvailability = typeof application.availability === 'string'
      ? JSON.parse(application.availability)
      : application.availability;

    console.log('📋 Application availability:');
    console.log(JSON.stringify(appAvailability, null, 2));
    console.log('');

    // 4. Expert의 availability 업데이트 (기존 holidaySettings 유지)
    const currentAvail = typeof expert.availability === 'string'
      ? JSON.parse(expert.availability)
      : expert.availability || {};

    const updatedAvailability = {
      ...appAvailability,
      holidaySettings: currentAvail.holidaySettings || {
        acceptHolidayConsultations: false,
        holidayNote: ''
      }
    };

    await prisma.expert.update({
      where: { id: expert.id },
      data: {
        availability: updatedAvailability as any
      }
    });

    console.log('✅ Expert availability 업데이트 완료\n');

    // 5. availabilitySlots 생성
    const DAY_MAPPING: Record<string, string> = {
      'MONDAY': 'MONDAY',
      'TUESDAY': 'TUESDAY',
      'WEDNESDAY': 'WEDNESDAY',
      'THURSDAY': 'THURSDAY',
      'FRIDAY': 'FRIDAY',
      'SATURDAY': 'SATURDAY',
      'SUNDAY': 'SUNDAY',
    };

    const slotsToCreate = [];

    for (const [key, value] of Object.entries(appAvailability)) {
      const dayKey = DAY_MAPPING[key];

      if (!dayKey) continue;

      const dayData = value as any;
      if (!dayData || typeof dayData !== 'object') continue;

      const available = dayData.available === true;
      if (!available) continue;

      const hours = dayData.hours || '09:00-18:00';
      const [startTime, endTime] = hours.split('-');

      if (startTime && endTime) {
        slotsToCreate.push({
          expertId: expert.id,
          dayOfWeek: dayKey as any,
          startTime: startTime.trim(),
          endTime: endTime.trim(),
          isActive: true,
        });
      }
    }

    if (slotsToCreate.length > 0) {
      await prisma.expertAvailability.createMany({
        data: slotsToCreate,
        skipDuplicates: true,
      });

      console.log(`✅ ${slotsToCreate.length}개 availabilitySlots 생성 완료`);
      console.log('   생성된 슬롯:');
      slotsToCreate.forEach((slot) => {
        console.log(`   - ${slot.dayOfWeek}: ${slot.startTime}-${slot.endTime}`);
      });
    } else {
      console.log('⚠️  생성할 슬롯이 없습니다.');
    }

    console.log('\n=== 완료 ===');
  } catch (error: any) {
    console.error('❌ 에러 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixJaewonAvailability();
