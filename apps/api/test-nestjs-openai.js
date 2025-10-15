const axios = require('axios');

async function testChatEndpoint() {
  try {
    console.log('🧪 NestJS Chat Endpoint 테스트\n');
    console.log('='.repeat(60));

    // Health check
    console.log('\n1. Health Check...');
    const health = await axios.get('http://localhost:4000/v1/health');
    console.log('✅ Server is running:', health.data);

    console.log('\n2. 채팅 엔드포인트 테스트');
    console.log('❌ 인증이 필요합니다.');
    console.log('\n다음 방법 중 하나를 선택하세요:');
    console.log('\n방법 1: 브라우저 개발자 도구에서 확인');
    console.log('  - Network 탭 열기');
    console.log('  - /v1/chat/message 요청 찾기');
    console.log('  - Response 탭에서 서버 응답 확인');
    console.log('  - Console 탭에서 에러 상세 확인');

    console.log('\n방법 2: 서버 터미널 로그 확인');
    console.log('  - NestJS 서버가 실행 중인 터미널 확인');
    console.log('  - 채팅 메시지 전송 시 출력되는 로그 확인');
    console.log('  - [ChatService], [OpenAIService] 태그가 있는 로그 찾기');

    console.log('\n방법 3: 서버 재시작');
    console.log('  - Ctrl+C로 서버 종료');
    console.log('  - pnpm dev:api 로 재시작');
    console.log('  - 초기화 로그 확인:');
    console.log('    [OpenAIService] Initializing...');
    console.log('    [OpenAIService] ✅ Initialized successfully');

    console.log('\n='.repeat(60));

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('\n❌ 서버가 실행 중이지 않습니다!');
      console.error('다음 명령어로 서버를 시작하세요:');
      console.error('  cd apps/api && pnpm start:dev');
    } else {
      console.error('\n❌ 에러 발생:', error.message);
    }
  }
}

testChatEndpoint();
