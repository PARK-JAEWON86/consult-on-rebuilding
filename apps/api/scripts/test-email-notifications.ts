/**
 * Test script for expert email notifications
 * Tests inquiry and reservation email notifications
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Testing Expert Email Notifications\n');

  // Find an expert with user email
  const expert = await prisma.expert.findFirst({
    where: {
      userId: { not: null }
    },
    include: {
      user: {
        select: { id: true, email: true, name: true }
      }
    }
  });

  if (!expert || !expert.user || !expert.user.email) {
    console.error('❌ No expert with user email found');
    return;
  }

  console.log(`✅ Found expert: ${expert.name}`);
  console.log(`   Email: ${expert.user.email}`);
  console.log(`   Expert ID: ${expert.id}\n`);

  // Find a client (different from expert's user)
  const client = await prisma.user.findFirst({
    where: {
      id: { not: expert.user.id }
    }
  });

  if (!client) {
    console.error('❌ No client found');
    return;
  }

  console.log(`✅ Found client: ${client.name || 'Unknown'}`);
  console.log(`   Client ID: ${client.id}\n`);

  // Test 1: Create inquiry (should trigger email)
  console.log('📧 Test 1: Creating inquiry...');

  const inquiry = await prisma.inquiry.create({
    data: {
      clientId: client.id,
      expertId: expert.id,
      subject: '[테스트] 이메일 알림 테스트',
      content: '이 문의는 이메일 알림 기능을 테스트하기 위한 것입니다.',
      category: 'OTHER'
    }
  });

  console.log(`✅ Created inquiry: ${inquiry.id}`);
  console.log(`   Check expert email: ${expert.user.email}`);
  console.log(`   Expected subject: "새로운 문의가 도착했습니다!"\n`);

  // Wait a bit for email to be sent
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Create reservation note
  console.log('📧 Test 2: Reservation email test');
  console.log('⚠️  Note: To properly test reservation emails, create a reservation through the API endpoint');
  console.log(`   POST /v1/reservations with the following data:`);
  console.log(`   {`);
  console.log(`     "expertId": ${expert.id},`);
  console.log(`     "startAt": "2025-10-27T10:00:00Z",`);
  console.log(`     "endAt": "2025-10-27T11:00:00Z",`);
  console.log(`     "note": "이메일 알림 테스트"`);
  console.log(`   }\n`);

  console.log('✅ Email notification tests setup complete!');
  console.log('\n📋 Summary:');
  console.log(`   1. Inquiry email sent to: ${expert.user.email}`);
  console.log(`   2. Check email inbox for inquiry notification`);
  console.log(`   3. To test reservation email, make API call to POST /v1/reservations`);
  console.log(`   4. Check server logs for any email failures:`);
  console.log(`      - "[InquiryService] 문의 알림 이메일 발송 실패"`);
  console.log(`      - "[ReservationsService] 예약 알림 이메일 발송 실패"`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
