const puppeteer = require('puppeteer');

async function testWebLogin() {
  let browser;

  try {
    console.log('브라우저 시작...');
    browser = await puppeteer.launch({
      headless: false, // 브라우저를 볼 수 있도록 headless 모드 비활성화
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // 로그인 페이지로 이동
    console.log('로그인 페이지로 이동...');
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle0' });

    // 페이지 타이틀 확인
    const title = await page.title();
    console.log('페이지 타이틀:', title);

    // 이메일과 비밀번호 입력
    console.log('로그인 정보 입력...');
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', 'testuser@example.com');
    await page.type('input[name="password"]', 'testuser123');

    // 로그인 버튼 클릭
    console.log('로그인 버튼 클릭...');
    await page.click('button[type="submit"]');

    // 응답 대기 (5초)
    console.log('응답 대기...');
    await page.waitForTimeout(5000);

    // 현재 URL 확인
    const currentUrl = page.url();
    console.log('현재 URL:', currentUrl);

    // 페이지 내용 확인 (에러 메시지가 있는지)
    const pageContent = await page.content();
    const hasError = pageContent.includes('로그인에 실패했습니다') || pageContent.includes('error');

    if (hasError) {
      console.log('❌ 로그인 실패: 페이지에 에러 메시지가 있습니다.');

      // 에러 메시지 추출
      try {
        const errorElement = await page.$('.text-red-600');
        if (errorElement) {
          const errorText = await page.evaluate(el => el.textContent, errorElement);
          console.log('에러 메시지:', errorText);
        }
      } catch (e) {
        console.log('에러 메시지를 찾을 수 없습니다.');
      }
    } else if (currentUrl.includes('/dashboard') || currentUrl.includes('/')) {
      console.log('✅ 로그인 성공: 대시보드 또는 메인 페이지로 리다이렉트됨');
    } else {
      console.log('⚠️  알 수 없는 상태: 현재 URL을 확인해주세요.');
    }

  } catch (error) {
    console.error('테스트 중 오류 발생:', error.message);
  } finally {
    if (browser) {
      console.log('브라우저 종료...');
      await browser.close();
    }
  }
}

testWebLogin();