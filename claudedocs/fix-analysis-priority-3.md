# 우선순위 3: 프론트엔드 refreshUser 에러 처리 개선 분석

## 📋 개요

**목적**: 서버 에러 시 기존 로그인 세션 유지 (401만 로그아웃)
**영향도**: ⭐⭐⭐⭐ (높음)
**위험도**: ⭐⭐ (낮음)
**예상 소요시간**: 10분

---

## 🎯 해결하려는 문제

### 현재 동작 (문제)

```typescript
// AuthProvider.tsx:47-73
const refreshUser = async () => {
  setIsLoading(true)
  try {
    const response = await api.get('/auth/me')

    if (response.success && response.data && response.data.user) {
      setUser(response.data.user)
    } else {
      setUser(null)  // ⚠️ 문제 1: 응답 형식 이상하면 로그아웃
    }
  } catch (error) {
    if ((error as any)?.status !== 401) {
      console.error('[AuthProvider] Failed to refresh user:', error)
    }
    setUser(null)  // ⚠️ 문제 2: 모든 에러에서 로그아웃
  } finally {
    setIsLoading(false)
  }
}
```

### 문제 시나리오

#### 시나리오 1: 데이터베이스 에러
1. 사용자가 로그인 상태
2. `refreshUser()` 호출
3. 백엔드 DB 에러 발생 (MySQL 성능 문제 등)
4. `api.get('/auth/me')` throws error (500)
5. catch 블록에서 `setUser(null)` 실행
6. **사용자 강제 로그아웃** ❌

#### 시나리오 2: 네트워크 오류
1. 사용자가 로그인 상태
2. `refreshUser()` 호출
3. 네트워크 끊김
4. fetch 실패
5. catch 블록에서 `setUser(null)` 실행
6. **사용자 강제 로그아웃** ❌

#### 시나리오 3: 서버 일시 장애
1. 사용자가 로그인 상태
2. `refreshUser()` 호출
3. 서버 재시작 중 (503)
4. catch 블록에서 `setUser(null)` 실행
5. **사용자 강제 로그아웃** ❌

### 올바른 동작

- **401 Unauthorized**: 로그아웃 처리 ✅ (인증 실패)
- **500 Internal Server Error**: 로그인 유지 ✅ (서버 문제)
- **503 Service Unavailable**: 로그인 유지 ✅ (일시 장애)
- **Network Error**: 로그인 유지 ✅ (네트워크 문제)

---

## 🔧 수정 방안

### 파일: `apps/web/src/components/auth/AuthProvider.tsx`

**위치**: Line 47-73

### 변경 전 (문제 코드)

```typescript
const refreshUser = async () => {
  console.log('[AuthProvider] refreshUser called')
  setIsLoading(true)
  try {
    const response = await api.get('/auth/me')
    console.log('[AuthProvider] /auth/me response:', response)

    if (response.success && response.data && response.data.user) {
      console.log('[AuthProvider] Setting user:', response.data.user)
      setUser(response.data.user)
    } else {
      console.log('[AuthProvider] No user data in response')
      setUser(null)  // ⚠️ 문제 1
    }
  } catch (error) {
    // 401은 정상적인 미인증 상태이므로 에러 로그 출력하지 않음
    if ((error as any)?.status !== 401) {
      console.error('[AuthProvider] Failed to refresh user:', error)
    } else {
      console.log('[AuthProvider] 401 - user not authenticated')
    }
    setUser(null)  // ⚠️ 문제 2
  } finally {
    setIsLoading(false)
    console.log('[AuthProvider] refreshUser completed')
  }
}
```

### 변경 후 (수정 코드)

```typescript
const refreshUser = async () => {
  console.log('[AuthProvider] refreshUser called')
  setIsLoading(true)
  try {
    const response = await api.get('/auth/me')
    console.log('[AuthProvider] /auth/me response:', response)

    if (response.success && response.data && response.data.user) {
      console.log('[AuthProvider] Setting user:', response.data.user)
      setUser(response.data.user)
    } else {
      console.log('[AuthProvider] No user data in response')
      // ✅ 수정: 응답 형식이 이상해도 기존 세션 유지
      // 서버가 user를 반환하지 않은 것은 일시적 문제일 수 있음
      console.warn('[AuthProvider] Unexpected response format, keeping existing session')
    }
  } catch (error) {
    const status = (error as any)?.status

    if (status === 401) {
      // ✅ 401 Unauthorized: 인증 실패 - 로그아웃 처리
      console.log('[AuthProvider] 401 - user not authenticated, logging out')
      setUser(null)
    } else {
      // ✅ 수정: 다른 모든 에러는 기존 세션 유지
      console.error('[AuthProvider] Failed to refresh user (keeping existing session):', {
        status,
        message: (error as any)?.message,
        error
      })

      // 서버 에러, 네트워크 에러 등은 일시적 문제
      // 사용자는 여전히 인증된 상태이므로 세션 유지
      // 다음 refreshUser 호출 시 복구 가능
    }
  } finally {
    setIsLoading(false)
    console.log('[AuthProvider] refreshUser completed')
  }
}
```

---

## 📊 영향 분석

### 긍정적 영향

1. **로그인 안정성 대폭 향상**
   - 일시적 서버 문제로 로그아웃되지 않음
   - 네트워크 불안정해도 로그인 유지
   - 사용자 경험 크게 개선

2. **resilience (복원력) 향상**
   - 부분 장애에 강건함
   - 자동 복구 가능 (다음 refresh 시)
   - 사용자가 재로그인 안 해도 됨

3. **실제 인증 문제와 일시 에러 구분**
   - 401: 진짜 인증 실패 → 로그아웃
   - 500, 503, Network: 일시 문제 → 세션 유지

### 부정적 영향

1. **만료된 세션 지속 가능성**
   - 서버가 401 대신 500 반환 시 로그인 유지됨
   - **현실적으로 드뭄**: 대부분 백엔드는 401 제대로 반환

2. **오래된 사용자 데이터**
   - refresh 실패 시 오래된 user 객체 유지
   - **수용 가능**: 다음 refresh나 페이지 새로고침 시 갱신됨

### 종합 평가
- **이득**: 로그인 안정성 대폭 향상
- **비용**: 극히 드문 경우 오래된 데이터 일시 표시
- **결론**: **즉시 적용 권장** ⭐⭐⭐⭐

---

## 🔄 다른 코드에 미치는 영향

### 영향받는 부분 검토

#### 1. application-status/page.tsx
```typescript
// Line 19-44
useEffect(() => {
  const initializePage = async () => {
    if (!isLoading && user) {
      try {
        await refreshUser()
      } catch (error) {
        // 갱신 실패해도 페이지는 보여줌
      }
    }
    setIsInitialRefreshComplete(true)
  }
  initializePage()
}, [isLoading, isInitialRefreshComplete])
```
- ✅ **호환**: refreshUser가 throw 하지 않으므로 정상 작동
- ✅ **개선**: refreshUser 실패해도 user는 유지됨

#### 2. login 함수
```typescript
// Line 76-126
const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials)
  if (response.success) {
    await refreshUser()  // 로그인 후 사용자 정보 갱신
    // ...
  }
}
```
- ✅ **호환**: refreshUser 실패해도 로그인은 성공 처리됨
- ⚠️ **주의**: refreshUser 실패 시 user 객체가 비어있을 수 있음
- ✅ **수용 가능**: 로그인은 성공했으므로 다음 refresh에서 복구

#### 3. logout 함수
```typescript
// Line 186-197
const logout = async () => {
  try {
    await api.post('/auth/logout')
  } catch (error) {
    console.error('Logout failed:', error)
  } finally {
    setUser(null)  // 로그아웃은 항상 user 삭제
    router.push('/auth/login')
  }
}
```
- ✅ **영향 없음**: logout은 독립적으로 작동

---

## ✅ 검증 방법

### 시나리오 테스트

#### 테스트 1: 401 Unauthorized (정상 로그아웃)
```typescript
// Mock: /auth/me가 401 반환
jest.spyOn(api, 'get').mockRejectedValue({ status: 401 })

await refreshUser()

// 예상 결과:
// - setUser(null) 호출됨 ✅
// - 사용자 로그아웃됨 ✅
```

#### 테스트 2: 500 Internal Server Error (세션 유지)
```typescript
// Mock: /auth/me가 500 반환
jest.spyOn(api, 'get').mockRejectedValue({ status: 500, message: 'DB error' })

const existingUser = { id: 152, email: 'test@example.com' }
setUser(existingUser)

await refreshUser()

// 예상 결과:
// - setUser(null) 호출 안 됨 ✅
// - user 객체 유지됨 (existingUser) ✅
// - 에러 로그 출력됨 ✅
```

#### 테스트 3: Network Error (세션 유지)
```typescript
// Mock: 네트워크 에러
jest.spyOn(api, 'get').mockRejectedValue(new Error('Network request failed'))

const existingUser = { id: 152, email: 'test@example.com' }
setUser(existingUser)

await refreshUser()

// 예상 결과:
// - setUser(null) 호출 안 됨 ✅
// - user 객체 유지됨 ✅
```

### 통합 테스트

**시나리오 1**: 백엔드 DB 에러 → 로그인 유지
```bash
# 1. 사용자 로그인
curl -X POST http://localhost:3000/api/auth/login \
  -d '{"email":"test@example.com","password":"password"}' \
  -c cookies.txt

# 2. 백엔드 DB 강제 에러 (인덱스 제거 등)
# MySQL: DROP INDEX ...

# 3. /auth/me 호출
curl http://localhost:3000/api/auth/me -b cookies.txt

# 4. 프론트엔드 확인
# - refreshUser() 실패하지만
# - 사용자 여전히 로그인 상태 ✅
# - 페이지 정상 작동 ✅
```

**시나리오 2**: 401 응답 → 로그아웃
```bash
# 1. 사용자 로그인
# 2. 쿠키 강제 만료/삭제
# 3. /auth/me 호출 → 401
# 4. 프론트엔드 확인
# - refreshUser()가 setUser(null) 호출 ✅
# - 로그인 페이지로 리다이렉트 ✅
```

---

## 🔄 롤백 방법

원래 코드로 복구:

```typescript
const refreshUser = async () => {
  console.log('[AuthProvider] refreshUser called')
  setIsLoading(true)
  try {
    const response = await api.get('/auth/me')
    console.log('[AuthProvider] /auth/me response:', response)

    if (response.success && response.data && response.data.user) {
      console.log('[AuthProvider] Setting user:', response.data.user)
      setUser(response.data.user)
    } else {
      console.log('[AuthProvider] No user data in response')
      setUser(null)  // 원래대로
    }
  } catch (error) {
    if ((error as any)?.status !== 401) {
      console.error('[AuthProvider] Failed to refresh user:', error)
    } else {
      console.log('[AuthProvider] 401 - user not authenticated')
    }
    setUser(null)  // 원래대로
  } finally {
    setIsLoading(false)
    console.log('[AuthProvider] refreshUser completed')
  }
}
```

---

## 📝 주의사항

### 적용 전 확인사항
- ✅ 우선순위 1, 2 먼저 적용 권장
- ✅ 백엔드가 401을 제대로 반환하는지 확인
- ✅ 기존 인증 플로우 영향 검토

### 적용 후 모니터링
- ✅ refreshUser 실패 빈도 확인
- ✅ 사용자 로그아웃 비율 모니터링 (감소 예상)
- ✅ 오래된 사용자 데이터 표시 이슈 모니터링

### Edge Case 처리

**Case 1**: 서버가 계속 500 반환
- **현상**: user 객체가 계속 오래됨
- **복구**: 사용자가 페이지 새로고침하면 재로그인 유도
- **수용 가능**: 서버 장애 중이므로 어차피 서비스 불가

**Case 2**: 토큰은 만료됐는데 서버가 500 반환
- **현상**: 로그인 상태 유지됨 (잘못된 상태)
- **현실성**: 거의 없음 (백엔드는 401 반환해야 함)
- **복구**: 사용자가 다음 액션 시도하면 401 받고 로그아웃

---

## 🎯 결론

**우선순위 3으로 적용 권장 (우선순위 1, 2 이후)**

**이유**:
1. ⭐ 로그인 안정성 대폭 향상
2. ⭐ 사용자 경험 개선 (재로그인 불필요)
3. ⭐ resilience 원칙 준수
4. ⭐ 실제 인증 문제와 일시 에러 구분
5. ⭐ 프론트엔드 호환성 유지

**다음 단계**: 전체 수정사항 통합 테스트
