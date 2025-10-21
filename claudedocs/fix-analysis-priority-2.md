# 우선순위 2: 백엔드 getUserById 에러 처리 개선 분석

## 📋 개요

**목적**: ExpertApplication 쿼리 실패 시에도 기본 사용자 정보 반환
**영향도**: ⭐⭐⭐⭐ (높음)
**위험도**: ⭐⭐ (낮음)
**예상 소요시간**: 10분

---

## 🎯 해결하려는 문제

### 현재 동작 (문제)

```typescript
// auth.service.ts:243-433
async getUserById(userId: number) {
  try {
    // ... 사용자 조회 ...

    // Line 281-284: 문제 부분 ⚠️
    const expertApplication = await this.prisma.expertApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
    // ☝️ 이 쿼리가 실패하면 전체 함수 실패!

    // ... 나머지 로직 ...
    return result

  } catch (error: any) {
    // Line 392-431: 모든 에러 처리
    throw new UnauthorizedException(...)  // ❌ 사용자 정보 반환 안 함!
  }
}
```

### 문제 시나리오

1. 사용자 152가 로그인
2. `/auth/me` 엔드포인트 호출
3. `getUserById(152)` 실행
4. ExpertApplication 쿼리 실패 (MySQL Error 1038)
5. **전체 함수가 UnauthorizedException throw**
6. 프론트엔드가 401 에러 받음
7. **사용자 강제 로그아웃**

### 기대 동작

1. ExpertApplication 쿼리 실패
2. `expertApplication = null`로 처리
3. **기본 사용자 정보는 정상 반환**
4. 사용자 로그인 상태 유지 ✅

---

## 🔧 수정 방안

### 파일: `apps/api/src/auth/auth.service.ts`

**위치**: Line 280-292

### 변경 전 (문제 코드)

```typescript
// 전문가 지원 상태 확인
const expertApplication = await this.prisma.expertApplication.findFirst({
  where: { userId },
  orderBy: { createdAt: 'desc' }
})

console.log('[getUserById] ExpertApplication lookup:', {
  userId,
  found: !!expertApplication,
  status: expertApplication?.status,
  hasKeywords: !!expertApplication?.keywords,
  hasConsultationTypes: !!expertApplication?.consultationTypes
})
```

### 변경 후 (수정 코드)

```typescript
// 전문가 지원 상태 확인 (에러 발생 시에도 사용자 정보는 반환)
let expertApplication = null
try {
  expertApplication = await this.prisma.expertApplication.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  })

  console.log('[getUserById] ExpertApplication lookup success:', {
    userId,
    found: !!expertApplication,
    status: expertApplication?.status,
    hasKeywords: !!expertApplication?.keywords,
    hasConsultationTypes: !!expertApplication?.consultationTypes
  })
} catch (error: any) {
  // ExpertApplication 조회 실패해도 사용자 기본 정보는 반환
  console.error('[getUserById] ExpertApplication lookup failed (continuing with user data):', {
    userId,
    errorMessage: error?.message,
    errorCode: error?.code,
    isPrismaError: error?.code?.startsWith('P'),
    isMySQLError: error?.meta?.code
  })

  // expertApplication은 null로 유지
  // 아래 로직은 expertApplication이 null이어도 정상 작동:
  // - Line 316-317: expertApplicationStatus, expertApplicationId는 null
  // - Line 326: expertApplicationData는 생성 안 됨 (조건문 false)
}
```

---

## 📊 영향 분석

### 긍정적 영향

1. **인증 시스템 안정성 향상**
   - ExpertApplication 조회 실패해도 사용자 로그인 유지
   - 부분 장애가 전체 장애로 전파되지 않음

2. **사용자 경험 개선**
   - 로그인 상태 유지
   - 기본 기능은 계속 사용 가능
   - 전문가 신청 정보만 일시적으로 표시 안 됨

3. **디버깅 용이성**
   - 상세한 에러 로그 출력
   - 어떤 부분이 실패했는지 명확히 파악 가능

### 부정적 영향

1. **전문가 신청 정보 누락 가능성**
   - ExpertApplication 쿼리 실패 시 `expertApplicationData` 없음
   - 프론트엔드에서 전문가 신청 상태 확인 불가
   - **하지만**: 이미 로그인 못하는 것보다 훨씬 나음

2. **에러 은폐 위험**
   - ExpertApplication 문제가 계속 발생해도 사용자는 모를 수 있음
   - **대응**: 에러 로그를 명확히 출력하여 모니터링 가능

### 종합 평가
- **이득**: 사용자 로그인 안정성 확보
- **비용**: 전문가 신청 정보 일시적 누락 (수용 가능)
- **결론**: **즉시 적용 권장** ⭐⭐⭐⭐

---

## 🔄 다른 코드에 미치는 영향

### 영향받는 부분 검토

#### 1. expertApplicationStatus, expertApplicationId 필드
```typescript
// Line 316-317
expertApplicationStatus: expertApplication?.status || null,
expertApplicationId: expertApplication?.id || null
```
- ✅ **안전**: `expertApplication`이 null이면 둘 다 null
- ✅ **정상 작동**: 프론트엔드에서 null 처리 가능

#### 2. expertApplicationData 객체
```typescript
// Line 326-384
if (expertApplication && (expertApplication.status === 'PENDING' || ...)) {
  result.expertApplicationData = { ... }
}
```
- ✅ **안전**: `expertApplication`이 null이면 조건문 false
- ✅ **정상 작동**: `expertApplicationData` 필드 생성 안 됨

#### 3. 외부 catch 블록
```typescript
// Line 392-431
} catch (error: any) {
  console.error('[getUserById] Error:', ...)
  throw new UnauthorizedException(...)
}
```
- ✅ **안전**: ExpertApplication 에러는 내부 catch에서 처리됨
- ✅ **정상 작동**: 다른 치명적 에러만 여기서 처리

### 프론트엔드 호환성

#### AuthProvider.tsx
```typescript
// Line 54-60
if (response.success && response.data && response.data.user) {
  setUser(response.data.user)
} else {
  setUser(null)
}
```
- ✅ **호환**: `response.success && response.data.user`는 여전히 true
- ✅ **정상 작동**: 사용자 정보 정상 설정됨

#### application-status/page.tsx
```typescript
// Line 48-53
if (user && (user as any).expertApplicationData) {
  const appData = (user as any).expertApplicationData
  // ...
}
```
- ✅ **호환**: `expertApplicationData`가 없으면 조건문 false
- ⚠️ **주의**: 전문가 신청 정보 표시 안 됨
- ✅ **수용 가능**: 로그인 안 되는 것보다 나음

---

## ✅ 검증 방법

### 단위 테스트 (새로 추가)

**파일**: `apps/api/src/auth/auth.service.spec.ts`

```typescript
describe('getUserById - ExpertApplication error handling', () => {
  it('should return user data even if ExpertApplication query fails', async () => {
    // Mock: ExpertApplication 쿼리 실패 시뮬레이션
    jest.spyOn(prisma.expertApplication, 'findFirst')
      .mockRejectedValue(new Error('Out of sort memory'))

    const result = await authService.getUserById(152)

    // 사용자 기본 정보는 반환되어야 함
    expect(result).toBeDefined()
    expect(result.id).toBe(152)
    expect(result.email).toBe('jw.original@gmail.com')

    // ExpertApplication 관련 필드는 null
    expect(result.expertApplicationStatus).toBeNull()
    expect(result.expertApplicationId).toBeNull()
    expect(result.expertApplicationData).toBeUndefined()
  })

  it('should include expertApplicationData when query succeeds', async () => {
    // Mock: ExpertApplication 쿼리 성공
    jest.spyOn(prisma.expertApplication, 'findFirst')
      .mockResolvedValue({ status: 'PENDING', ... })

    const result = await authService.getUserById(152)

    // ExpertApplication 정보 포함
    expect(result.expertApplicationStatus).toBe('PENDING')
    expect(result.expertApplicationData).toBeDefined()
  })
})
```

### 통합 테스트

**시나리오 1**: ExpertApplication 쿼리 실패
```bash
# MySQL에서 인덱스 임시 제거
DROP INDEX `ExpertApplication_userId_createdAt_idx` ON `ExpertApplication`;

# API 테스트
curl http://localhost:4000/v1/auth/me \
  -H "Cookie: access_token=..." \
  -v

# 예상 결과:
# - HTTP 200 (성공)
# - user 객체 반환
# - expertApplicationStatus: null
# - expertApplicationData: 없음
```

**시나리오 2**: ExpertApplication 쿼리 성공
```bash
# 인덱스 복구
CREATE INDEX `ExpertApplication_userId_createdAt_idx`
ON `ExpertApplication`(`userId`, `createdAt`);

# API 테스트
curl http://localhost:4000/v1/auth/me \
  -H "Cookie: access_token=..." \
  -v

# 예상 결과:
# - HTTP 200 (성공)
# - user 객체 반환
# - expertApplicationStatus: "PENDING"
# - expertApplicationData: { ... }
```

### 로그 모니터링

**성공 케이스**:
```
[getUserById] User found: { userId: 152, email: 'jw.original@gmail.com', hasExpert: false }
[getUserById] ExpertApplication lookup success: { userId: 152, found: true, status: 'PENDING', ... }
[getUserById] Successfully prepared user data: { userId: 152, hasExpertApplicationData: true }
```

**실패 케이스**:
```
[getUserById] User found: { userId: 152, email: 'jw.original@gmail.com', hasExpert: false }
[getUserById] ExpertApplication lookup failed (continuing with user data): {
  userId: 152,
  errorMessage: 'Out of sort memory',
  errorCode: undefined,
  isPrismaError: false,
  isMySQLError: 1038
}
[getUserById] Successfully prepared user data: { userId: 152, hasExpertApplicationData: false }
```

---

## 🔄 롤백 방법

간단히 try-catch 블록 제거:

```typescript
// 원래 코드로 복구
const expertApplication = await this.prisma.expertApplication.findFirst({
  where: { userId },
  orderBy: { createdAt: 'desc' }
})
```

---

## 📝 주의사항

### 적용 전 확인사항
- ✅ 우선순위 1 (인덱스 추가) 먼저 적용 권장
- ✅ 프론트엔드 호환성 확인
- ✅ 기존 테스트 케이스 영향 검토

### 적용 후 모니터링
- ✅ ExpertApplication 에러 로그 빈도 확인
- ✅ `/auth/me` 엔드포인트 성공률 모니터링
- ✅ 사용자 로그인 안정성 지표 확인

---

## 🎯 결론

**우선순위 2로 적용 권장 (인덱스 추가 후)**

**이유**:
1. ⭐ 인증 시스템 안정성 확보
2. ⭐ 부분 장애 격리 (전파 방지)
3. ⭐ 사용자 경험 개선
4. ⭐ 방어적 프로그래밍 원칙 준수
5. ⭐ 프론트엔드 호환성 유지

**다음 단계**: 우선순위 3 (프론트엔드 에러 처리) 진행
