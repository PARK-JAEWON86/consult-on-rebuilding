const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function insertNotificationData() {
  try {
    console.log('Creating notification data based on current system...');

    // 사용자들과 예약, 결제 데이터 가져오기
    const users = await prisma.user.findMany({
      select: { id: true, name: true, roles: true }
    });

    const reservations = await prisma.reservation.findMany({
      take: 20,
      select: { id: true, userId: true, expertId: true, cost: true, note: true, status: true },
      orderBy: { createdAt: 'desc' }
    });

    const payments = await prisma.paymentIntent.findMany({
      take: 15,
      select: { id: true, userId: true, displayId: true, amount: true, status: true, metadata: true },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${users.length} users, ${reservations.length} reservations, ${payments.length} payments`);

    // 알림 타입별 데이터 생성
    const notifications = [];

    // 1. 상담 관련 알림 (20개)
    for (let i = 0; i < Math.min(10, reservations.length); i++) {
      const reservation = reservations[i];

      // 상담 완료 알림
      notifications.push({
        userId: reservation.userId,
        type: 'CONSULTATION_COMPLETED',
        title: '상담이 완료되었습니다',
        message: `${reservation.note || '상담'}이 성공적으로 완료되었습니다.`,
        data: {
          reservationId: reservation.id,
          expertId: reservation.expertId,
          cost: reservation.cost,
          rating: Math.floor(Math.random() * 2) + 4 // 4-5점
        },
        isRead: Math.random() > 0.5,
        priority: 'MEDIUM',
        expiresAt: null
      });

      // 상담 요청 알림 (전문가용)
      if (i < 5) {
        notifications.push({
          userId: reservation.expertId + 1, // Expert ID를 User ID로 매핑
          type: 'CONSULTATION_REQUEST',
          title: '새로운 상담 신청',
          message: `새로운 ${reservation.note || '상담'} 신청이 있습니다.`,
          data: {
            reservationId: reservation.id,
            clientId: reservation.userId,
            consultationType: Math.random() > 0.5 ? 'video' : 'chat',
            cost: reservation.cost
          },
          isRead: Math.random() > 0.3,
          priority: 'HIGH',
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48시간 후
        });
      }
    }

    // 2. 결제 관련 알림 (15개)
    for (let i = 0; i < Math.min(15, payments.length); i++) {
      const payment = payments[i];

      if (payment.status === 'SUCCEEDED') {
        // 결제 완료 알림
        notifications.push({
          userId: payment.userId,
          type: 'PAYMENT_COMPLETED',
          title: '결제가 완료되었습니다',
          message: `${payment.amount.toLocaleString()}원 결제가 성공적으로 완료되었습니다.`,
          data: {
            paymentId: payment.displayId,
            amount: payment.amount,
            method: Math.random() > 0.5 ? 'card' : 'bank_transfer'
          },
          isRead: Math.random() > 0.2,
          priority: 'MEDIUM',
          expiresAt: null
        });
      }

      // 크레딧 구매 알림 (metadata가 있는 경우)
      if (payment.metadata && payment.metadata.paymentType === 'credit_purchase') {
        notifications.push({
          userId: payment.userId,
          type: 'CREDIT_PURCHASE_COMPLETED',
          title: '크레딧 충전이 완료되었습니다',
          message: `${payment.amount.toLocaleString()}원 크레딧이 성공적으로 충전되었습니다.`,
          data: {
            paymentId: payment.displayId,
            amount: payment.amount,
            credits: payment.metadata.credits || payment.amount,
            packageType: payment.metadata.packageType || 'basic'
          },
          isRead: Math.random() > 0.4,
          priority: 'MEDIUM',
          expiresAt: null
        });
      }
    }

    // 3. 시스템 알림 (25개)
    const systemNotifications = [
      // 공지사항
      {
        type: 'SYSTEM',
        title: '서비스 업데이트 안내',
        message: '새로운 기능이 추가되었습니다. 상담 예약 시스템이 개선되었어요!',
        data: {
          type: 'announcement',
          version: '2.1.0',
          features: ['개선된 예약 시스템', '새로운 결제 수단']
        },
        priority: 'MEDIUM',
        expiresAt: new Date('2025-12-31T23:59:59Z')
      },
      // 이벤트 알림
      {
        type: 'SYSTEM',
        title: '신규 사용자 이벤트',
        message: '첫 상담 50% 할인 이벤트가 진행 중입니다! 지금 신청하세요.',
        data: {
          type: 'event',
          eventId: 'first_consultation_50',
          discount: 50,
          validUntil: '2025-12-31'
        },
        priority: 'HIGH',
        expiresAt: new Date('2025-12-31T23:59:59Z')
      },
      // 보안 알림
      {
        type: 'SYSTEM',
        title: '로그인 알림',
        message: '새로운 기기에서 로그인되었습니다. 본인이 아닌 경우 즉시 비밀번호를 변경해주세요.',
        data: {
          type: 'security',
          device: 'Chrome on Windows',
          location: '서울, 대한민국',
          ip: '192.168.1.100'
        },
        priority: 'HIGH',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7일 후
      },
      // 크레딧 부족 알림
      {
        type: 'SYSTEM',
        title: '크레딧이 부족합니다',
        message: '상담을 진행하기 위해 크레딧을 충전해주세요. 현재 잔액이 부족합니다.',
        data: {
          type: 'credit_low',
          currentBalance: Math.floor(Math.random() * 10000) + 1000,
          requiredAmount: Math.floor(Math.random() * 20000) + 10000
        },
        priority: 'HIGH',
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3일 후
      },
      // 리뷰 요청
      {
        type: 'SYSTEM',
        title: '리뷰 작성 요청',
        message: '최근 완료된 상담에 대한 리뷰를 작성해 주시면 크레딧을 드려요!',
        data: {
          type: 'review_request',
          incentive: '1000 크레딧',
          deadline: '2025-01-15'
        },
        priority: 'MEDIUM',
        expiresAt: new Date('2025-01-15T23:59:59Z')
      }
    ];

    // 각 사용자에게 시스템 알림 분배
    const clientUsers = users.filter(user => {
      const roles = JSON.parse(user.roles);
      return roles.includes('USER');
    }).slice(0, 15);

    for (const sysNotif of systemNotifications) {
      for (let i = 0; i < Math.min(5, clientUsers.length); i++) {
        notifications.push({
          userId: clientUsers[i].id,
          ...sysNotif,
          isRead: Math.random() > 0.6
        });
      }
    }

    console.log(`Generated ${notifications.length} notifications`);

    // 데이터베이스에 삽입
    let insertedCount = 0;
    for (const notification of notifications) {
      try {
        const displayId = `NOTIF${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        await prisma.notification.create({
          data: {
            displayId,
            ...notification,
            readAt: notification.isRead ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) : null
          }
        });

        insertedCount++;

        // 요청 부하를 줄이기 위해 짧은 지연
        await new Promise(resolve => setTimeout(resolve, 50));

        if (insertedCount % 10 === 0) {
          console.log(`Inserted ${insertedCount} notifications...`);
        }
      } catch (error) {
        console.error(`Failed to create notification:`, error.message);
      }
    }

    console.log('Notification data insertion completed!');

    // 최종 통계 확인
    const stats = await Promise.all([
      prisma.notification.count(),
      prisma.notification.groupBy({
        by: ['type'],
        _count: { type: true }
      }),
      prisma.notification.groupBy({
        by: ['priority'],
        _count: { priority: true }
      }),
      prisma.notification.count({ where: { isRead: true } }),
      prisma.notification.count({ where: { isRead: false } })
    ]);

    console.log(`\nFinal statistics:`);
    console.log(`Total notifications: ${stats[0]}`);
    console.log(`Type distribution:`);
    stats[1].forEach(stat => {
      console.log(`  ${stat.type}: ${stat._count.type} notifications`);
    });
    console.log(`Priority distribution:`);
    stats[2].forEach(stat => {
      console.log(`  ${stat.priority}: ${stat._count.priority} notifications`);
    });
    console.log(`Read notifications: ${stats[3]}`);
    console.log(`Unread notifications: ${stats[4]}`);

  } catch (error) {
    console.error('Error inserting notification data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertNotificationData();