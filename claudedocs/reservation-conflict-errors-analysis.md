# 예약 요청 충돌 에러 분석 및 수정 방안

## 분석 일시
2025-10-26

## 문제 상황
전문가 상세 페이지에서 예약 요청 버튼 클릭 시 여러 충돌 에러로 인해 전문가에게 요청이 전송되지 않는 문제

## 발견된 주요 에러

### 1. 🔴 하드코딩된 API URL 문제 (CRITICAL)

**위치**:
- `apps/web/src/components/reservation/ReservationModalImproved.tsx:158` (✅ 이미 수정됨)
- `apps/web/src/components/experts/ExpertProfileDetail.tsx:99` (❌ 수정 필요)

**에러 내용**:
```typescript
// ❌ 잘못된 코드 (ExpertProfileDetail.tsx:99)
const response = await api.get(`http://localhost:4000/v1/credits/balance?userId=${user?.id}`);
```

**문제점**:
1. 절대 URL 사용 시 axios가 baseURL 설정을 무시함
2. 하드코딩된 포트(4000)가 실제 API 서버와 다를 수 있음
3. 환경 변수 `NEXT_PUBLIC_API_URL`이 무시됨
4. 프로덕션 환경에서 localhost를 호출하여 실패

**영향**:
- 사용자 크레딧 조회 실패
- 예약 가능 여부 판단 불가
- 예약 모달이 정상적으로 작동하지 않음

**수정 방안**:
```typescript
// ✅ 올바른 코드
const response = await api.get(`/credits/balance?userId=${user?.id}`);
```

### 2. 🔴 알림 설정 API 에러 - userId undefined (CRITICAL) ✅ FIXED

**위치**:
- `apps/api/src/notifications/notifications.service.ts:136` (getUserSettings 메서드)
- `apps/api/src/notifications/notifications.controller.ts:103` (getSettings 엔드포인트)

**에러 로그**:
```
PrismaClientValidationError:
Invalid `this.prisma.userNotificationSetting.findUnique()` invocation
where: {
  userId: undefined,  // ❌ userId가 undefined
}
```

**근본 원인 분석**:
1. **컨트롤러만 수정해서는 불충분**: 초기에는 컨트롤러에만 userId 검증을 추가했으나, 에러가 지속됨
2. **내부 서비스 호출 문제**: `getUserSettings()` 메서드가 4군데에서 호출됨
   - notifications.controller.ts:116 (HTTP 엔드포인트) ✅ 보호됨
   - notifications.service.ts:187 (예약 알림 생성 시) ❌ 보호 안 됨
   - notifications.service.ts:230 (다른 내부 로직) ❌ 보호 안 됨
   - notifications.service.ts:288 (또 다른 내부 로직) ❌ 보호 안 됨
3. **실제 원인**: 내부 서비스 메서드 호출 시 `reservation.userId`가 undefined인 경우 발생

**영향**:
- 알림 설정 조회 시 500 에러 발생
- 사용자 프로필 페이지 로딩 실패 가능
- 예약 관련 알림 설정 불가
- 크론잡 실행 시 에러 발생 가능

**적용된 수정사항**:
1. ✅ **Controller 레벨 보호** (notifications.controller.ts:103-122):
   ```typescript
   const userId = req.user?.userId;
   if (!userId) {
     return { success: false, error: { code: 'E_USER_NOT_AUTHENTICATED', ... } };
   }
   ```
2. ✅ **Service 레벨 보호** (notifications.service.ts:137-140):
   ```typescript
   if (!userId || typeof userId !== 'number') {
     throw new Error(`Invalid userId: ${userId}. Cannot retrieve notification settings.`);
   }
   ```

### 3. 🟡 MySQL Sort Buffer 메모리 부족 (IMPORTANT)

**위치**: `apps/api/src/experts/experts.service.js:136`

**에러 로그**:
```
MysqlError {
  code: 1038,
  message: "Out of sort memory, consider increasing server sort buffer size"
}
```

**문제점**:
1. 전문가 목록 조회 시 대량의 데이터 정렬
2. MySQL의 sort_buffer_size가 부족
3. 복잡한 쿼리나 JOIN으로 인한 메모리 초과

**영향**:
- 전문가 목록 페이지 로딩 실패
- 전문가 검색 기능 중단
- 500 에러로 인한 사용자 경험 저하

**수정 방안**:
1. **단기 해결책**: MySQL sort_buffer_size 증가
2. **중기 해결책**: 쿼리 최적화 (인덱스 추가, JOIN 개선)
3. **장기 해결책**: 페이지네이션 개선, 캐싱 도입

### 4. 🟡 광범위한 하드코딩된 URL 사용 (IMPORTANT)

**발견된 파일 수**: 26개

**주요 파일**:
- ReservationModalImproved.tsx (✅ 수정됨)
- ExpertProfileDetail.tsx (❌ 수정 필요)
- ExpertCard.tsx
- IconOnlySidebar.tsx
- AuthProvider.tsx
- 기타 22개 파일

**문제점**:
- 일관성 없는 API 호출
- 환경별 설정 불가
- 배포 시 URL 변경 필요

## 예약 요청 실패 원인 분석

### 직접적 원인
1. ✅ **ReservationModalImproved.tsx의 하드코딩된 URL** (이미 수정됨)
   - `/reservations` 엔드포인트 호출 실패
   - 예약 생성 요청이 잘못된 서버로 전송

2. ❌ **ExpertProfileDetail.tsx의 크레딧 조회 실패**
   - 사용자 크레딧 확인 불가
   - 예약 가능 여부 판단 불가

### 간접적 원인
1. **알림 설정 에러로 인한 페이지 로딩 지연**
   - 500 에러 반복 발생
   - 네트워크 탭에 에러 누적

2. **MySQL 에러로 인한 전문가 데이터 로딩 실패**
   - 전문가 정보 조회 불가
   - 예약 가능 시간 정보 없음

## 우선순위별 수정 계획

### 🔴 긴급 (Immediate)
1. **ExpertProfileDetail.tsx의 하드코딩 URL 수정**
   - Line 99: `/credits/balance?userId=${user?.id}` 로 변경
   - 예상 시간: 5분

2. **NotificationsService userId undefined 수정**
   - NotificationsController 확인
   - 인증 미들웨어 검증
   - 예상 시간: 30분

### 🟡 중요 (High Priority)
3. **MySQL sort_buffer_size 증가**
   - my.cnf 설정 변경
   - 서버 재시작 필요
   - 예상 시간: 15분

4. **전문가 목록 쿼리 최적화**
   - 불필요한 JOIN 제거
   - 인덱스 추가
   - 예상 시간: 2시간

### 🟢 개선 (Medium Priority)
5. **전체 하드코딩 URL 일괄 수정**
   - 26개 파일 검토 및 수정
   - 예상 시간: 4시간

6. **API 호출 표준화**
   - 공통 API 함수 생성
   - 타입 안전성 강화
   - 예상 시간: 3시간

## 즉시 적용 가능한 수정사항

### 1. ExpertProfileDetail.tsx 크레딧 조회 수정
```typescript
// Before (Line 99)
const response = await api.get(`http://localhost:4000/v1/credits/balance?userId=${user?.id}`);

// After
const response = await api.get(`/credits/balance?userId=${user?.id}`);
```

### 2. MySQL 설정 개선
```sql
-- my.cnf 또는 my.ini
[mysqld]
sort_buffer_size = 4M  # 현재 기본값에서 증가
max_length_for_sort_data = 2048
```

### 3. Notifications Service 방어 코드 추가
```typescript
async getUserSettings(userId: number) {
  if (!userId) {
    throw new BadRequestException('User ID is required');
  }

  let settings = await this.prisma.userNotificationSetting.findUnique({
    where: { userId }
  });
  // ...
}
```

## 테스트 계획

### 1. 예약 요청 플로우 테스트
- [ ] 전문가 상세 페이지 로딩
- [ ] 크레딧 잔액 조회
- [ ] 예약 모달 열기
- [ ] 날짜/시간 선택
- [ ] 상담 정보 입력
- [ ] 예약 요청 제출
- [ ] 전문가에게 알림 전송 확인

### 2. 에러 해결 검증
- [ ] 알림 설정 API 500 에러 해결 확인
- [ ] 전문가 목록 조회 에러 해결 확인
- [ ] 하드코딩 URL 수정 후 API 호출 성공 확인

### 3. 성능 테스트
- [ ] MySQL 쿼리 실행 시간 측정
- [ ] 전문가 목록 로딩 시간 확인
- [ ] 네트워크 요청 실패율 확인

## 결론

주요 문제는 **하드코딩된 API URL**로 인한 예약 요청 실패였으며, 이미 ReservationModalImproved.tsx는 수정되었습니다. 그러나 ExpertProfileDetail.tsx의 크레딧 조회도 같은 문제가 있어 추가 수정이 필요합니다.

또한 알림 설정 API의 userId undefined 에러와 MySQL sort buffer 에러가 전체적인 사용자 경험을 저하시키고 있어 우선적으로 해결해야 합니다.

## 관련 파일
- `/apps/web/src/components/reservation/ReservationModalImproved.tsx`
- `/apps/web/src/components/experts/ExpertProfileDetail.tsx`
- `/apps/api/src/notifications/notifications.service.js`
- `/apps/api/src/experts/experts.service.js`
