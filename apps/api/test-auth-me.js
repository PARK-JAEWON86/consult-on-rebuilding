const axios = require('axios');

async function testAuthMe() {
  try {
    console.log('1. 로그인 시도...');

    // 1. 로그인
    const loginResponse = await axios.post('http://localhost:3001/v1/auth/login', {
      email: 'testuser@example.com',
      password: 'testuser123'
    }, {
      withCredentials: true
    });

    console.log('로그인 응답:', loginResponse.data);

    // 쿠키에서 access_token 추출
    const cookies = loginResponse.headers['set-cookie'];
    let accessToken = null;

    if (cookies) {
      for (const cookie of cookies) {
        if (cookie.startsWith('access_token=')) {
          accessToken = cookie.split('access_token=')[1].split(';')[0];
          break;
        }
      }
    }

    if (!accessToken) {
      console.error('Access token을 찾을 수 없습니다.');
      return;
    }

    console.log('2. /auth/me 요청...');

    // 2. /auth/me 요청
    const meResponse = await axios.get('http://localhost:3001/v1/auth/me', {
      headers: {
        'Cookie': `access_token=${accessToken}`
      }
    });

    console.log('사용자 정보 응답:');
    console.log(JSON.stringify(meResponse.data, null, 2));

    // roles 타입 확인
    const userData = meResponse.data.data.user;
    console.log('\n=== 역할 정보 분석 ===');
    console.log('roles 값:', userData.roles);
    console.log('roles 타입:', typeof userData.roles);
    console.log('roles가 배열인가?', Array.isArray(userData.roles));

    if (Array.isArray(userData.roles)) {
      console.log('EXPERT 역할 포함?', userData.roles.includes('EXPERT'));
    } else {
      console.log('roles가 배열이 아닙니다!');
    }

  } catch (error) {
    console.error('오류 발생:', error.response?.data || error.message);
  }
}

testAuthMe();