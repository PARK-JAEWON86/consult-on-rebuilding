const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixSettlementsSessions() {
  try {
    console.log('Creating session records with required channel field...');

    const sessionData = [
      { id: 201, displayId: 'SES_KM_001_2025', reservationId: 3001, startedAt: '2025-01-15 14:00:00', endedAt: '2025-01-15 15:00:00', duration: 60 },
      { id: 202, displayId: 'SES_KM_002_2025', reservationId: 3002, startedAt: '2025-01-22 16:00:00', endedAt: '2025-01-22 17:30:00', duration: 90 },
      { id: 203, displayId: 'SES_PC_001_2025', reservationId: 3006, startedAt: '2025-01-12 10:00:00', endedAt: '2025-01-12 12:00:00', duration: 120 },
      { id: 204, displayId: 'SES_YT_001_2025', reservationId: 3009, startedAt: '2025-01-10 15:00:00', endedAt: '2025-01-10 16:30:00', duration: 90 }
    ];

    let sessionsCreated = 0;

    for (const session of sessionData) {
      try {
        const existing = await prisma.session.findUnique({
          where: { id: session.id }
        });

        if (existing) {
          console.log(`  Session ${session.id} already exists, skipping...`);
          continue;
        }

        // Generate unique channel name
        const channel = `channel_${session.displayId.toLowerCase()}_${Date.now()}`;

        await prisma.session.create({
          data: {
            id: session.id,
            displayId: session.displayId,
            reservationId: session.reservationId,
            channel: channel,
            status: 'ENDED',
            startedAt: new Date(session.startedAt),
            endedAt: new Date(session.endedAt),
            duration: session.duration
          }
        });

        sessionsCreated++;
        console.log(`  Created session ${session.id}: ${session.displayId} (${session.duration} min)`);

      } catch (error) {
        console.error(`Failed to create session ${session.id}:`, error.message);
      }
    }

    // 최종 정산 검증
    console.log('\n=== Final Settlement Verification ===');

    const verificationData = await prisma.reservation.findMany({
      where: { id: { gte: 3000 } }
    });

    const totalRevenue = verificationData.reduce((sum, res) => sum + res.cost, 0);
    const platformFee = Math.round(totalRevenue * 0.12);
    const expertRevenue = Math.round(totalRevenue * 0.88);

    console.log(`Sessions created: ${sessionsCreated}`);
    console.log(`\nSettlement Summary:`);
    console.log(`  Total consultations: ${verificationData.length}`);
    console.log(`  Gross revenue: ₩${totalRevenue.toLocaleString()}`);
    console.log(`  Platform fee (12%): ₩${platformFee.toLocaleString()}`);
    console.log(`  Expert revenue (88%): ₩${expertRevenue.toLocaleString()}`);

    // 전문가별 수익 확인
    const expertRevenues = await prisma.creditTransaction.groupBy({
      by: ['userId'],
      where: {
        reason: 'consultation:completed',
        refId: { startsWith: 'RES_2025_' }
      },
      _sum: { amount: true },
      _count: { amount: true }
    });

    console.log(`\nExpert revenues (2025 consultations):`);
    for (const revenue of expertRevenues) {
      const expert = await prisma.expert.findUnique({
        where: { id: revenue.userId },
        select: { name: true }
      });
      console.log(`  ${expert?.name || `Expert ${revenue.userId}`}: ₩${revenue._sum.amount?.toLocaleString()} (${revenue._count.amount} consultations)`);
    }

  } catch (error) {
    console.error('Error fixing settlements sessions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSettlementsSessions();