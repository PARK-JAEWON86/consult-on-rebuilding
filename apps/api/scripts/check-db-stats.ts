import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseStats() {
  console.log('='.repeat(60));
  console.log('📊 데이터베이스 통계 확인');
  console.log('='.repeat(60));

  try {
    // ExpertApplication 테이블 통계
    const totalApplications = await prisma.expertApplication.count();
    const pendingApplications = await prisma.expertApplication.count({
      where: { status: 'PENDING' }
    });
    const approvedApplications = await prisma.expertApplication.count({
      where: { status: 'APPROVED' }
    });

    console.log('\n📝 ExpertApplication 테이블:');
    console.log('  전체 신청:', totalApplications, '건');
    console.log('  대기 중:', pendingApplications, '건');
    console.log('  승인됨:', approvedApplications, '건');

    // User 테이블 통계
    const totalUsers = await prisma.user.count();
    console.log('\n👥 User 테이블:');
    console.log('  전체 사용자:', totalUsers, '명');

    // Expert 테이블 통계
    const totalExperts = await prisma.expert.count();
    console.log('\n🎓 Expert 테이블:');
    console.log('  전체 전문가:', totalExperts, '명');

    // 인덱스 확인 (MySQL)
    console.log('\n🔍 ExpertApplication 인덱스 확인:');
    const indexes: any = await prisma.$queryRaw`
      SHOW INDEX FROM ExpertApplication
    `;

    const indexMap = new Map();
    indexes.forEach((idx: any) => {
      if (!indexMap.has(idx.Key_name)) {
        indexMap.set(idx.Key_name, []);
      }
      indexMap.get(idx.Key_name).push(idx.Column_name);
    });

    indexMap.forEach((columns, indexName) => {
      console.log(`  ${indexName}: [${columns.join(', ')}]`);
    });

    // MySQL 설정 확인
    console.log('\n⚙️  MySQL 정렬 버퍼 설정:');
    const sortBuffer: any = await prisma.$queryRaw`
      SHOW VARIABLES LIKE 'sort_buffer_size'
    `;
    if (sortBuffer.length > 0) {
      const bufferSize = parseInt(sortBuffer[0].Value);
      const bufferMB = (bufferSize / 1024 / 1024).toFixed(2);
      console.log(`  sort_buffer_size: ${bufferSize} bytes (${bufferMB} MB)`);
    }

    // 데이터베이스 크기 확인
    console.log('\n💾 데이터베이스 크기:');
    const dbSize: any = await prisma.$queryRaw`
      SELECT
        table_schema AS 'Database',
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      GROUP BY table_schema
    `;
    if (dbSize.length > 0) {
      console.log(`  전체 크기: ${dbSize[0]['Size (MB)']} MB`);
    }

    console.log('\n' + '='.repeat(60));

  } catch (error: any) {
    console.error('❌ 에러 발생:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseStats();
