# Chat API Debug Guide

## 브라우저에서 확인할 사항

### Network 탭에서:
1. F12 → Network 탭
2. 채팅 메시지 전송
3. `/chat/message` 요청 찾기
4. 다음 정보 확인:

**Request:**
- Method: POST
- URL: http://localhost:4000/v1/chat/message
- Status Code: ???

**Response:**
- 전체 응답 JSON 복사

**Headers:**
- Content-Type: application/json?
- Cookie: access_token이 있는지?

### Console 탭에서:
특정 로그 찾기:
```
[Chat] Sending message to API: ...
[API Interceptor] Response received: {url: '/chat/message', ...}
[Chat] Error details: ...
```

## 예상 문제들

### 1. 쿠키/인증 문제
- access_token이 전송되지 않음
- 401 Unauthorized 발생

### 2. CORS 문제
- preflight 요청 실패
- Origin 헤더 문제

### 3. 응답 파싱 문제
- 백엔드는 성공 응답을 보냄
- 프론트엔드가 응답을 잘못 해석

## 빠른 확인 방법

브라우저 콘솔에서 실행:
```javascript
// 쿠키 확인
document.cookie

// 수동 API 호출 테스트
fetch('http://localhost:4000/v1/chat/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    message: '테스트'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```
