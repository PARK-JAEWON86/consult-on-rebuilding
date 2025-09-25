const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkReservationData() {
  try {
    console.log('Checking current reservation data consistency...');

    // 1. 현재 예약 데이터 확인
    const existingReservations = await prisma.reservation.count();
    console.log(`Current reservations: ${existingReservations}`);

    if (existingReservations > 0) {
      const sampleReservations = await prisma.reservation.findMany({
        take: 5,
        select: {
          id: true,
          displayId: true,
          userId: true,
          expertId: true,
          status: true,
          cost: true,
          startAt: true
        },
        orderBy: { id: 'asc' }
      });

      console.log('\nSample existing reservations:');
      sampleReservations.forEach(res => {
        console.log(`  ID: ${res.id}, Display: ${res.displayId}, User: ${res.userId}, Expert: ${res.expertId}, Status: ${res.status}`);
      });
    }

    // 2. 사용자 ID 범위 확인
    const users = await prisma.user.findMany({
      select: { id: true, name: true, roles: true },
      orderBy: { id: 'asc' }
    });

    const clients = users.filter(user => {
      const roles = JSON.parse(user.roles);
      return roles.includes('USER');
    });

    console.log(`\nTotal users: ${users.length}`);
    console.log(`Client users: ${clients.length}`);
    console.log('User IDs range:', users.length > 0 ? `${users[0].id} - ${users[users.length - 1].id}` : 'None');
    console.log('Client IDs range:', clients.length > 0 ? `${clients[0].id} - ${clients[clients.length - 1].id}` : 'None');

    // 3. 전문가 ID 범위 확인
    const experts = await prisma.expert.findMany({
      select: { id: true, name: true, specialty: true },
      orderBy: { id: 'asc' }
    });

    console.log(`\nTotal experts: ${experts.length}`);
    console.log('Expert IDs range:', experts.length > 0 ? `${experts[0].id} - ${experts[experts.length - 1].id}` : 'None');

    // 4. SQL 데이터 ID 매핑 분석
    console.log('\nSQL vs Database ID mapping analysis:');
    console.log('SQL userIds: 32-56 (25 users)');
    console.log('SQL expertIds: 1-30 (30 experts)');
    console.log(`DB client IDs: ${clients.length > 0 ? `${clients[0].id} - ${clients[clients.length - 1].id}` : 'None'}`);
    console.log(`DB expert IDs: ${experts.length > 0 ? `${experts[0].id} - ${experts[experts.length - 1].id}` : 'None'}`);

    // 5. 예약 상태 확인
    if (existingReservations > 0) {
      const statusCounts = await prisma.reservation.groupBy({
        by: ['status'],
        _count: { status: true }
      });

      console.log('\nReservation status distribution:');
      statusCounts.forEach(stat => {
        console.log(`  ${stat.status}: ${stat._count.status} reservations`);
      });
    }

    // 6. 최근 예약 ID 확인 (새 예약의 시작점을 위해)
    if (existingReservations > 0) {
      const maxReservation = await prisma.reservation.findFirst({
        select: { id: true, displayId: true },
        orderBy: { id: 'desc' }
      });
      console.log(`\nLast reservation ID: ${maxReservation?.id}`);
      console.log(`Last display ID: ${maxReservation?.displayId}`);
    }

  } catch (error) {
    console.error('Error checking reservation data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkReservationData();