const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function insertAvailabilityForAllExperts() {
  try {
    console.log('🔄 Adding availability data for all experts...');

    // 모든 활성화된 전문가 조회
    const experts = await prisma.expert.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    });

    console.log(`📊 Found ${experts.length} active experts`);

    // 다양한 예약 가능시간 템플릿들
    const availabilityTemplates = [
      // 템플릿 1: 일반적인 평일 근무 시간
      [
        { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 'THURSDAY', startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '17:00' },
      ],

      // 템플릿 2: 오전/오후 분할
      [
        { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '12:00' },
        { dayOfWeek: 'MONDAY', startTime: '14:00', endTime: '18:00' },
        { dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '12:00' },
        { dayOfWeek: 'TUESDAY', startTime: '14:00', endTime: '18:00' },
        { dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 'THURSDAY', startTime: '10:00', endTime: '16:00' },
        { dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '15:00' },
      ],

      // 템플릿 3: 오후 중심
      [
        { dayOfWeek: 'MONDAY', startTime: '13:00', endTime: '19:00' },
        { dayOfWeek: 'TUESDAY', startTime: '13:00', endTime: '19:00' },
        { dayOfWeek: 'WEDNESDAY', startTime: '14:00', endTime: '20:00' },
        { dayOfWeek: 'THURSDAY', startTime: '13:00', endTime: '19:00' },
        { dayOfWeek: 'FRIDAY', startTime: '13:00', endTime: '18:00' },
        { dayOfWeek: 'SATURDAY', startTime: '10:00', endTime: '16:00' },
      ],

      // 템플릿 4: 긴 시간 (고경험 전문가)
      [
        { dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '20:00' },
        { dayOfWeek: 'TUESDAY', startTime: '08:00', endTime: '20:00' },
        { dayOfWeek: 'WEDNESDAY', startTime: '08:00', endTime: '20:00' },
        { dayOfWeek: 'THURSDAY', startTime: '08:00', endTime: '20:00' },
        { dayOfWeek: 'FRIDAY', startTime: '08:00', endTime: '18:00' },
        { dayOfWeek: 'SATURDAY', startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 'SUNDAY', startTime: '10:00', endTime: '16:00' },
      ],

      // 템플릿 5: 주말 중심
      [
        { dayOfWeek: 'WEDNESDAY', startTime: '16:00', endTime: '20:00' },
        { dayOfWeek: 'THURSDAY', startTime: '16:00', endTime: '20:00' },
        { dayOfWeek: 'FRIDAY', startTime: '14:00', endTime: '22:00' },
        { dayOfWeek: 'SATURDAY', startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 'SUNDAY', startTime: '10:00', endTime: '17:00' },
      ],

      // 템플릿 6: 저녁 시간 전문
      [
        { dayOfWeek: 'MONDAY', startTime: '18:00', endTime: '22:00' },
        { dayOfWeek: 'TUESDAY', startTime: '18:00', endTime: '22:00' },
        { dayOfWeek: 'WEDNESDAY', startTime: '18:00', endTime: '22:00' },
        { dayOfWeek: 'THURSDAY', startTime: '18:00', endTime: '22:00' },
        { dayOfWeek: 'FRIDAY', startTime: '19:00', endTime: '23:00' },
        { dayOfWeek: 'SATURDAY', startTime: '14:00', endTime: '20:00' },
        { dayOfWeek: 'SUNDAY', startTime: '15:00', endTime: '19:00' },
      ]
    ];

    let totalInserted = 0;
    let expertsUpdated = 0;

    for (const expert of experts) {
      // 이미 availability 데이터가 있는지 확인
      const existingSlots = await prisma.expertAvailability.findMany({
        where: { expertId: expert.id }
      });

      if (existingSlots.length > 0) {
        console.log(`⏭️  Expert ${expert.name} (ID: ${expert.id}) already has ${existingSlots.length} availability slots`);
        continue;
      }

      // 전문가별로 랜덤한 템플릿 선택
      const templateIndex = expert.id % availabilityTemplates.length;
      const selectedTemplate = availabilityTemplates[templateIndex];

      console.log(`📅 Adding ${selectedTemplate.length} slots for ${expert.name} (Template ${templateIndex + 1})`);

      // 선택된 템플릿의 모든 slot 추가
      for (const slot of selectedTemplate) {
        try {
          await prisma.expertAvailability.create({
            data: {
              expertId: expert.id,
              ...slot
            }
          });
          totalInserted++;
        } catch (error) {
          if (error.code === 'P2002') {
            console.log(`⚠️  Slot already exists for Expert ${expert.id}: ${slot.dayOfWeek} ${slot.startTime}-${slot.endTime}`);
          } else {
            throw error;
          }
        }
      }

      expertsUpdated++;
      console.log(`✅ Added availability slots for ${expert.name}`);
    }

    console.log(`\n🎉 Availability data insertion completed!`);
    console.log(`📊 Total slots inserted: ${totalInserted}`);
    console.log(`👥 Experts updated: ${expertsUpdated}`);
    console.log(`👥 Experts with existing data: ${experts.length - expertsUpdated}`);

    // 결과 확인 - 몇 개 전문가 샘플 출력
    console.log(`\n📋 Sample availability data:`);
    const sampleExperts = await prisma.expert.findMany({
      take: 5,
      include: {
        availabilitySlots: {
          where: { isActive: true },
          orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' }
          ]
        }
      }
    });

    sampleExperts.forEach(expert => {
      console.log(`\n👤 ${expert.name} (ID: ${expert.id}) - ${expert.availabilitySlots.length} slots:`);
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
  insertAvailabilityForAllExperts()
    .then(() => {
      console.log('\n✨ All experts availability data insertion completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Availability data insertion failed:', error);
      process.exit(1);
    });
}

module.exports = { insertAvailabilityForAllExperts };