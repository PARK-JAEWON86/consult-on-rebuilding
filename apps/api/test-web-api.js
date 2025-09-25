const axios = require('axios');

async function testWebAPI() {
  try {
    console.log('웹 프론트엔드 API 테스트 시작...');

    // 웹 프론트엔드를 통한 로그인 요청 (백엔드 API로 직접 요청)
    const response = await axios.post('http://localhost:3001/v1/auth/login', {
      email: 'testuser@example.com',
      password: 'testuser123'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000', // 웹 프론트엔드에서 요청하는 것처럼
        'Referer': 'http://localhost:3000/auth/login'
      },
      withCredentials: true
    });

    console.log('✅ 로그인 성공!');
    console.log('응답 데이터:', JSON.stringify(response.data, null, 2));

    // 쿠키 확인
    const cookies = response.headers['set-cookie'];
    if (cookies) {
      console.log('\n📝 설정된 쿠키:');
      cookies.forEach(cookie => {
        console.log(`  - ${cookie}`);
      });
    }

    console.log('\n🎯 결론: API는 정상적으로 작동하고 있습니다.');
    console.log('웹 프론트엔드에서 로그인이 안 되는 경우, 다음을 확인해보세요:');
    console.log('1. 브라우저 개발자 도구의 Network 탭에서 API 요청 상태');
    console.log('2. Console 탭에서 JavaScript 에러');
    console.log('3. Application 탭에서 쿠키 설정 상태');

  } catch (error) {
    console.error('❌ 요청 실패:', error.response?.data || error.message);

    if (error.response) {
      console.log('상태 코드:', error.response.status);
      console.log('응답 헤더:', error.response.headers);
    }
  }
}

testWebAPI();