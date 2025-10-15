# 관리자 대시보드 권한 문제 진단 결과

## 문제 상황
관리자 계정으로 로그인했지만 대시보드에 접근 시 권한 오류 발생

## 진단 결과

### ✅ 백엔드 설정 정상
1. **데이터베이스 AdminUser 레코드**
   - userId: 1
   - email: admin@consult-on.kr
   - role: SUPER_ADMIN ✓
   - SUPER_ADMIN은 모든 권한 보유

2. **CORS 설정**
   ```typescript
   app.enableCors({
     origin: [/^http:\/\/localhost:\d+$/],
     credentials: true, ✓
   })
   ```

3. **가드 체인**
   - JwtGuard → AdminGuard → AdminRoleGuard
   - SUPER_ADMIN은 모든 권한 체크 통과

### ✅ 프론트엔드 설정 정상
1. **API 클라이언트**
   ```typescript
   withCredentials: true, ✓
   ```

2. **API URL**
   - NEXT_PUBLIC_API_URL=http://localhost:4000/v1 ✓

## 🔍 실제 문제: 인증 토큰 부재

### 가능한 원인
1. **쿠키에 JWT 토큰이 없음**
   - 로그인 후 토큰이 제대로 저장되지 않음
   - 쿠키가 삭제됨 또는 만료됨

2. **토큰 만료**
   - 이전 로그인의 토큰이 만료됨

3. **쿠키 도메인/경로 불일치**
   - 쿠키가 설정되었지만 다른 도메인/경로에 저장됨

## 해결 방법

### 1. 브라우저에서 확인할 사항
```
개발자 도구 → Application → Cookies → http://localhost:3001
```
- `access_token` 쿠키 존재 여부 확인
- 쿠키 값 확인 (JWT 형식인지)
- Expires / Max-Age 확인

### 2. 네트워크 탭 확인
```
개발자 도구 → Network → /admin/analytics/dashboard-enhanced 요청
```
- Request Headers에 Cookie 포함 여부
- Response 상태 코드 확인 (401, 403 등)
- Response body의 error 메시지 확인

### 3. 재로그인 시도
- 완전히 로그아웃
- 브라우저 쿠키 삭제
- 관리자 계정으로 재로그인
- 대시보드 접근 시도

### 4. 로그인 엔드포인트 확인
백엔드 로그에서 로그인 시 쿠키 설정 확인:
```
apps/api/src/auth/auth.service.ts
```
- access_token 쿠키 설정 로직
- 쿠키 옵션 (httpOnly, secure, sameSite, domain, path)

## 다음 단계

1. 브라우저에서 쿠키 확인
2. 없으면 재로그인
3. 여전히 문제 발생 시 로그인 엔드포인트 쿠키 설정 검토
