const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function insertAvailabilityData() {
  try {
    console.log('🔄 Adding sample availability data...');

    // 전문가 3명에게 다양한 예약 가능시간 추가
    const availabilityData = [
      // 김민지 전문가 (ID: 2) - 평일 오전/오후
      { expertId: 2, dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '12:00' },
      { expertId: 2, dayOfWeek: 'MONDAY', startTime: '14:00', endTime: '18:00' },
      { expertId: 2, dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '12:00' },
      { expertId: 2, dayOfWeek: 'TUESDAY', startTime: '14:00', endTime: '18:00' },
      { expertId: 2, dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '17:00' },
      { expertId: 2, dayOfWeek: 'THURSDAY', startTime: '10:00', endTime: '16:00' },
      { expertId: 2, dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '15:00' },

      // 이준호 전문가 (ID: 3) - 오후 중심
      { expertId: 3, dayOfWeek: 'MONDAY', startTime: '13:00', endTime: '19:00' },
      { expertId: 3, dayOfWeek: 'TUESDAY', startTime: '13:00', endTime: '19:00' },
      { expertId: 3, dayOfWeek: 'WEDNESDAY', startTime: '14:00', endTime: '20:00' },
      { expertId: 3, dayOfWeek: 'THURSDAY', startTime: '13:00', endTime: '19:00' },
      { expertId: 3, dayOfWeek: 'FRIDAY', startTime: '13:00', endTime: '18:00' },
      { expertId: 3, dayOfWeek: 'SATURDAY', startTime: '10:00', endTime: '16:00' },

      // 박서준 전문가 (ID: 4) - 전 시간대
      { expertId: 4, dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '20:00' },
      { expertId: 4, dayOfWeek: 'TUESDAY', startTime: '08:00', endTime: '20:00' },
      { expertId: 4, dayOfWeek: 'WEDNESDAY', startTime: '08:00', endTime: '20:00' },
      { expertId: 4, dayOfWeek: 'THURSDAY', startTime: '08:00', endTime: '20:00' },
      { expertId: 4, dayOfWeek: 'FRIDAY', startTime: '08:00', endTime: '18:00' },
      { expertId: 4, dayOfWeek: 'SATURDAY', startTime: '09:00', endTime: '17:00' },
      { expertId: 4, dayOfWeek: 'SUNDAY', startTime: '10:00', endTime: '16:00' },
    ];

    let insertedCount = 0;
    for (const slot of availabilityData) {
      try {
        await prisma.expertAvailability.create({
          data: slot
        });
        console.log(`✅ Added availability for Expert ${slot.expertId}: ${slot.dayOfWeek} ${slot.startTime}-${slot.endTime}`);
        insertedCount++;
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️  Slot already exists for Expert ${slot.expertId}: ${slot.dayOfWeek} ${slot.startTime}-${slot.endTime}`);
        } else {
          throw error;
        }
      }
    }

    console.log(`\n🎉 Sample availability data insertion completed!`);
    console.log(`📊 Inserted ${insertedCount} new availability slots`);

    // 결과 확인
    const experts = await prisma.expert.findMany({
      where: { id: { in: [2, 3, 4] } },
      include: {
        availabilitySlots: {
          orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' }
          ]
        }
      }
    });

    console.log('\n📋 Current availability slots:');
    experts.forEach(expert => {
      console.log(`\n👤 ${expert.name} (ID: ${expert.id}):`);
      expert.availabilitySlots.forEach(slot => {
        console.log(`   ${slot.dayOfWeek}: ${slot.startTime}-${slot.endTime}`);
      });
    });

  } catch (error) {
    console.error('❌ Error during availability data insertion:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
if (require.main === module) {
  insertAvailabilityData()
    .then(() => {
      console.log('\n✨ Availability data insertion completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Availability data insertion failed:', error);
      process.exit(1);
    });
}

module.exports = { insertAvailabilityData };