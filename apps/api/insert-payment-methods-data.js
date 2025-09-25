const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function insertPaymentMethodsData() {
  try {
    console.log('Creating payment methods data based on SQL file...');

    // 기존 결제 수단 수 확인
    const existingPaymentMethods = await prisma.paymentMethod.count();
    console.log(`Currently ${existingPaymentMethods} payment methods in database`);

    // 모든 사용자 확인
    const allUsers = await prisma.user.findMany({
      select: { id: true, name: true, roles: true }
    });

    console.log(`Found ${allUsers.length} users in total`);

    // 결제 수단 데이터 생성
    const paymentMethodsData = [
      // 일반 사용자들의 결제 수단 (51개)
      // 김민수 (userId: 32)
      { userId: 32, type: 'card', name: '신한카드', last4: '1234', bankName: null, isDefault: true, expiryDate: '12/25' },
      { userId: 32, type: 'card', name: 'KB국민카드', last4: '5678', bankName: null, isDefault: false, expiryDate: '08/26' },
      { userId: 32, type: 'bank', name: '신한은행 계좌', last4: null, bankName: '신한은행', isDefault: false, expiryDate: null },

      // 이지영 (userId: 33)
      { userId: 33, type: 'card', name: '하나카드', last4: '9012', bankName: null, isDefault: true, expiryDate: '06/25' },
      { userId: 33, type: 'bank', name: '하나은행 계좌', last4: null, bankName: '하나은행', isDefault: false, expiryDate: null },

      // 박준호 (userId: 34)
      { userId: 34, type: 'card', name: '삼성카드', last4: '3456', bankName: null, isDefault: true, expiryDate: '09/26' },
      { userId: 34, type: 'card', name: '현대카드', last4: '7890', bankName: null, isDefault: false, expiryDate: '03/25' },

      // 최수진 (userId: 35)
      { userId: 35, type: 'card', name: '롯데카드', last4: '2468', bankName: null, isDefault: true, expiryDate: '11/25' },
      { userId: 35, type: 'bank', name: '국민은행 계좌', last4: null, bankName: '국민은행', isDefault: false, expiryDate: null },

      // 정현우 (userId: 36)
      { userId: 36, type: 'card', name: 'BC카드', last4: '1357', bankName: null, isDefault: true, expiryDate: '07/26' },
      { userId: 36, type: 'bank', name: '우리은행 계좌', last4: null, bankName: '우리은행', isDefault: false, expiryDate: null },

      // 정수민 (userId: 37)
      { userId: 37, type: 'card', name: 'NH카드', last4: '9753', bankName: null, isDefault: true, expiryDate: '05/25' },
      { userId: 37, type: 'card', name: '신한카드', last4: '8642', bankName: null, isDefault: false, expiryDate: '10/26' },

      // 한미래 (userId: 38)
      { userId: 38, type: 'card', name: 'KB국민카드', last4: '1597', bankName: null, isDefault: true, expiryDate: '04/26' },
      { userId: 38, type: 'bank', name: '신한은행 계좌', last4: null, bankName: '신한은행', isDefault: false, expiryDate: null },

      // 윤서진 (userId: 39)
      { userId: 39, type: 'card', name: '하나카드', last4: '7531', bankName: null, isDefault: true, expiryDate: '08/25' },
      { userId: 39, type: 'card', name: '삼성카드', last4: '4680', bankName: null, isDefault: false, expiryDate: '12/26' },

      // 조현우 (userId: 40)
      { userId: 40, type: 'card', name: '현대카드', last4: '2469', bankName: null, isDefault: true, expiryDate: '06/25' },
      { userId: 40, type: 'bank', name: '하나은행 계좌', last4: null, bankName: '하나은행', isDefault: false, expiryDate: null },

      // 강혜원 (userId: 41)
      { userId: 41, type: 'card', name: '롯데카드', last4: '8024', bankName: null, isDefault: true, expiryDate: '09/26' },
      { userId: 41, type: 'card', name: 'BC카드', last4: '3579', bankName: null, isDefault: false, expiryDate: '01/25' },

      // 김태현 (userId: 42)
      { userId: 42, type: 'card', name: 'NH카드', last4: '6802', bankName: null, isDefault: true, expiryDate: '11/25' },
      { userId: 42, type: 'bank', name: '국민은행 계좌', last4: null, bankName: '국민은행', isDefault: false, expiryDate: null },

      // 송민지 (userId: 43)
      { userId: 43, type: 'card', name: '신한카드', last4: '9753', bankName: null, isDefault: true, expiryDate: '07/26' },
      { userId: 43, type: 'card', name: 'KB국민카드', last4: '1357', bankName: null, isDefault: false, expiryDate: '03/25' },

      // 이동민 (userId: 44)
      { userId: 44, type: 'card', name: '하나카드', last4: '4680', bankName: null, isDefault: true, expiryDate: '05/25' },
      { userId: 44, type: 'bank', name: '우리은행 계좌', last4: null, bankName: '우리은행', isDefault: false, expiryDate: null },

      // 박소영 (userId: 45)
      { userId: 45, type: 'card', name: '삼성카드', last4: '8024', bankName: null, isDefault: true, expiryDate: '08/26' },
      { userId: 45, type: 'card', name: '현대카드', last4: '2469', bankName: null, isDefault: false, expiryDate: '12/25' },

      // 최준혁 (userId: 46)
      { userId: 46, type: 'card', name: '롯데카드', last4: '3579', bankName: null, isDefault: true, expiryDate: '06/25' },
      { userId: 46, type: 'bank', name: '신한은행 계좌', last4: null, bankName: '신한은행', isDefault: false, expiryDate: null },

      // 김예린 (userId: 47)
      { userId: 47, type: 'card', name: 'BC카드', last4: '6802', bankName: null, isDefault: true, expiryDate: '04/26' },
      { userId: 47, type: 'card', name: 'NH카드', last4: '9753', bankName: null, isDefault: false, expiryDate: '10/25' },

      // 정우진 (userId: 48)
      { userId: 48, type: 'card', name: '신한카드', last4: '1357', bankName: null, isDefault: true, expiryDate: '09/25' },
      { userId: 48, type: 'bank', name: '하나은행 계좌', last4: null, bankName: '하나은행', isDefault: false, expiryDate: null },

      // 송하은 (userId: 49)
      { userId: 49, type: 'card', name: 'KB국민카드', last4: '4680', bankName: null, isDefault: true, expiryDate: '07/26' },
      { userId: 49, type: 'card', name: '하나카드', last4: '8024', bankName: null, isDefault: false, expiryDate: '01/25' },

      // 이건우 (userId: 50)
      { userId: 50, type: 'card', name: '삼성카드', last4: '2469', bankName: null, isDefault: true, expiryDate: '05/25' },
      { userId: 50, type: 'bank', name: '국민은행 계좌', last4: null, bankName: '국민은행', isDefault: false, expiryDate: null },

      // 박채윤 (userId: 51)
      { userId: 51, type: 'card', name: '현대카드', last4: '3579', bankName: null, isDefault: true, expiryDate: '11/25' },
      { userId: 51, type: 'card', name: '롯데카드', last4: '6802', bankName: null, isDefault: false, expiryDate: '03/26' },

      // 추가 사용자들 (userId: 52-56)
      { userId: 52, type: 'card', name: 'BC카드', last4: '9753', bankName: null, isDefault: true, expiryDate: '08/25' },
      { userId: 52, type: 'bank', name: '우리은행 계좌', last4: null, bankName: '우리은행', isDefault: false, expiryDate: null },

      { userId: 53, type: 'card', name: 'NH카드', last4: '1357', bankName: null, isDefault: true, expiryDate: '06/26' },
      { userId: 53, type: 'bank', name: '신한은행 계좌', last4: null, bankName: '신한은행', isDefault: false, expiryDate: null },

      { userId: 54, type: 'card', name: '신한카드', last4: '4680', bankName: null, isDefault: true, expiryDate: '04/25' },
      { userId: 54, type: 'card', name: '삼성카드', last4: '7531', bankName: null, isDefault: false, expiryDate: '08/26' },

      { userId: 55, type: 'card', name: 'KB국민카드', last4: '8024', bankName: null, isDefault: true, expiryDate: '12/25' },
      { userId: 55, type: 'card', name: '현대카드', last4: '4682', bankName: null, isDefault: false, expiryDate: '06/25' },

      { userId: 56, type: 'card', name: '하나카드', last4: '2469', bankName: null, isDefault: true, expiryDate: '10/26' },
      { userId: 56, type: 'bank', name: '국민은행 계좌', last4: null, bankName: '국민은행', isDefault: false, expiryDate: null },

      // 전문가들의 결제 수단 (29개)
      // 김민수 전문가 (userId: 1)
      { userId: 1, type: 'card', name: '신한카드', last4: '1111', bankName: null, isDefault: true, expiryDate: '12/25' },
      { userId: 1, type: 'bank', name: '신한은행 계좌', last4: null, bankName: '신한은행', isDefault: false, expiryDate: null },

      // 이지은 전문가 (userId: 2)
      { userId: 2, type: 'card', name: 'KB국민카드', last4: '2222', bankName: null, isDefault: true, expiryDate: '08/26' },
      { userId: 2, type: 'card', name: '하나카드', last4: '3333', bankName: null, isDefault: false, expiryDate: '06/25' },

      // 박준호 전문가 (userId: 3)
      { userId: 3, type: 'card', name: '삼성카드', last4: '4444', bankName: null, isDefault: true, expiryDate: '10/25' },
      { userId: 3, type: 'bank', name: '하나은행 계좌', last4: null, bankName: '하나은행', isDefault: false, expiryDate: null },

      // 최수진 전문가 (userId: 4)
      { userId: 4, type: 'card', name: '현대카드', last4: '5555', bankName: null, isDefault: true, expiryDate: '04/26' },
      { userId: 4, type: 'card', name: '롯데카드', last4: '6666', bankName: null, isDefault: false, expiryDate: '12/25' },

      // 정민우 전문가 (userId: 5)
      { userId: 5, type: 'card', name: 'BC카드', last4: '7777', bankName: null, isDefault: true, expiryDate: '07/25' },
      { userId: 5, type: 'bank', name: '국민은행 계좌', last4: null, bankName: '국민은행', isDefault: false, expiryDate: null },

      // 김하늘 전문가 (userId: 6)
      { userId: 6, type: 'card', name: 'NH카드', last4: '8888', bankName: null, isDefault: true, expiryDate: '09/26' },
      { userId: 6, type: 'card', name: '신한카드', last4: '9999', bankName: null, isDefault: false, expiryDate: '05/25' },

      // 임가영 전문가 (userId: 7)
      { userId: 7, type: 'card', name: 'KB국민카드', last4: '0000', bankName: null, isDefault: true, expiryDate: '11/25' },
      { userId: 7, type: 'bank', name: '우리은행 계좌', last4: null, bankName: '우리은행', isDefault: false, expiryDate: null },

      // 오정민 전문가 (userId: 8)
      { userId: 8, type: 'card', name: '하나카드', last4: '1112', bankName: null, isDefault: true, expiryDate: '03/26' },
      { userId: 8, type: 'card', name: '삼성카드', last4: '2223', bankName: null, isDefault: false, expiryDate: '08/25' },

      // 송지훈 전문가 (userId: 9)
      { userId: 9, type: 'card', name: '현대카드', last4: '3334', bankName: null, isDefault: true, expiryDate: '06/25' },
      { userId: 9, type: 'bank', name: '신한은행 계좌', last4: null, bankName: '신한은행', isDefault: false, expiryDate: null },

      // 황수진 전문가 (userId: 10)
      { userId: 10, type: 'card', name: '롯데카드', last4: '4445', bankName: null, isDefault: true, expiryDate: '10/26' },
      { userId: 10, type: 'card', name: 'BC카드', last4: '5556', bankName: null, isDefault: false, expiryDate: '04/25' },

      // 심현석 전문가 (userId: 11)
      { userId: 11, type: 'card', name: 'NH카드', last4: '6667', bankName: null, isDefault: true, expiryDate: '12/25' },
      { userId: 11, type: 'bank', name: '하나은행 계좌', last4: null, bankName: '하나은행', isDefault: false, expiryDate: null },

      // 남궁민 전문가 (userId: 12)
      { userId: 12, type: 'card', name: '신한카드', last4: '7778', bankName: null, isDefault: true, expiryDate: '08/25' },
      { userId: 12, type: 'card', name: 'KB국민카드', last4: '8889', bankName: null, isDefault: false, expiryDate: '02/26' },

      // 유지혜 전문가 (userId: 13)
      { userId: 13, type: 'card', name: '하나카드', last4: '9990', bankName: null, isDefault: true, expiryDate: '07/26' },
      { userId: 13, type: 'bank', name: '국민은행 계좌', last4: null, bankName: '국민은행', isDefault: false, expiryDate: null },

      // 전창민 전문가 (userId: 14)
      { userId: 14, type: 'card', name: '삼성카드', last4: '0001', bankName: null, isDefault: true, expiryDate: '05/25' },
      { userId: 14, type: 'card', name: '현대카드', last4: '1113', bankName: null, isDefault: false, expiryDate: '11/25' },

      // 안소현 전문가 (userId: 15)
      { userId: 15, type: 'card', name: '롯데카드', last4: '2224', bankName: null, isDefault: true, expiryDate: '09/26' },
    ];

    console.log(`Prepared ${paymentMethodsData.length} payment methods to insert`);

    // 실제 존재하는 userId만 필터링
    const existingUserIds = new Set(allUsers.map(user => user.id));
    const validPaymentMethods = paymentMethodsData.filter(pm => existingUserIds.has(pm.userId));

    console.log(`${validPaymentMethods.length} payment methods match existing users`);

    // 데이터베이스에 삽입
    let insertedCount = 0;
    for (const pmData of validPaymentMethods) {
      try {
        const created = await prisma.paymentMethod.create({
          data: pmData
        });

        console.log(`Created payment method: ${created.id} - ${pmData.name} (${pmData.last4 || pmData.bankName}) for user ${pmData.userId}`);
        insertedCount++;

        // 요청 부하를 줄이기 위해 짧은 지연
        await new Promise(resolve => setTimeout(resolve, 50));

        if (insertedCount % 10 === 0) {
          console.log(`Inserted ${insertedCount} payment methods...`);
        }
      } catch (error) {
        console.error(`Failed to create payment method for user ${pmData.userId}:`, error.message);
      }
    }

    console.log('Payment methods data insertion completed!');

    // 최종 통계 확인
    const stats = await Promise.all([
      prisma.paymentMethod.count(),
      prisma.paymentMethod.groupBy({
        by: ['type'],
        _count: { type: true }
      }),
      prisma.paymentMethod.count({ where: { isDefault: true } }),
      prisma.paymentMethod.count({ where: { isDefault: false } })
    ]);

    console.log(`\nFinal statistics:`);
    console.log(`Total payment methods: ${stats[0]}`);
    console.log(`Type distribution:`);
    stats[1].forEach(stat => {
      console.log(`  ${stat.type}: ${stat._count.type} payment methods`);
    });
    console.log(`Default payment methods: ${stats[2]}`);
    console.log(`Non-default payment methods: ${stats[3]}`);

  } catch (error) {
    console.error('Error inserting payment methods data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertPaymentMethodsData();