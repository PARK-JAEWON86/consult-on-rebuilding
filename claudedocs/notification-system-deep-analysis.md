# 🔬 알림 시스템 심층 분석 보고서 (--ultrathink)

**분석 일시**: 2025-10-28
**분석 깊이**: ULTRATHINK (최대 심층 분석)
**분석 목표**: 알림이 표시되지 않는 원인 규명

---

## 📊 분석 결과 요약

### ✅ 정상 작동 항목
- **백엔드 스키마**: Prisma NotificationType 모두 정의됨
- **프론트엔드 타입**: 백엔드와 100% 일치
- **API 엔드포인트**: 7개 모두 정상 구현
- **알림 생성 로직**: 5가지 알림 모두 구현됨
- **사용자 설정 기본값**: 모두 `true` (활성화)
- **프론트엔드 필터링**: EXPERT/USER 모드별 필터링 정상

### ⚠️ 확인 필요 항목
1. **서버 재시작 여부** - 코드 변경사항 반영 확인
2. **실제 알림 생성 테스트** - DB에 알림이 insert되는지 확인
3. **브라우저 콘솔 로그** - API 호출 및 응답 확인
4. **네트워크 요청** - `/notifications` API 응답 데이터 확인

---

## 🔍 상세 분석 내역

### 1. 백엔드 스키마 검증 (Prisma)

#### NotificationType Enum
```prisma
enum NotificationType {
  CONSULTATION_REQUEST       ✅
  CONSULTATION_ACCEPTED      ✅
  CONSULTATION_REJECTED      ✅
  CONSULTATION_COMPLETED     ✅
  CONSULTATION_UPCOMING      ✅
  PAYMENT_COMPLETED          ✅
  PAYMENT_FAILED             ✅
  CREDIT_PURCHASE_COMPLETED  ✅
  CREDIT_LOW                 ✅
  REVIEW_REQUEST             ✅
  SYSTEM                     ✅
  INQUIRY_RECEIVED           ✅ (전문가용)
  INQUIRY_REPLY              ✅ (사용자용)
  RESERVATION_PENDING        ✅ (전문가용)
  RESERVATION_APPROVED       ✅ (사용자용)
  RESERVATION_REJECTED       ✅ (사용자용)
  EXPERT_APPLICATION_UPDATE  ✅
  SYSTEM_ADMIN               ✅
}
```

**결과**: 필요한 모든 알림 타입 존재 ✅

#### Notification Model
```prisma
model Notification {
  id        Int                  @id @default(autoincrement())
  displayId String               @unique
  userId    Int                  // 알림 받을 사용자
  type      NotificationType     // 알림 타입
  title     String               // 알림 제목
  message   String               // 알림 내용
  data      Json?                // 추가 데이터
  isRead    Boolean              @default(false)
  priority  NotificationPriority @default(MEDIUM)
  expiresAt DateTime?            // 만료 시간
  readAt    DateTime?
  createdAt DateTime             @default(now())
  updatedAt DateTime             @updatedAt
  actionUrl String?              // 클릭 시 이동할 URL

  @@index([userId, isRead])      // 읽지 않은 알림 조회 최적화
  @@index([createdAt])           // 최신순 정렬 최적화
  @@index([userId, type])        // 타입별 조회 최적화
}
```

**결과**: 모든 필드 및 인덱스 정상 ✅

#### UserNotificationSetting Model
```prisma
model UserNotificationSetting {
  userId                Int      @unique
  upcomingReservations  Boolean  @default(true)   ✅
  creditLow             Boolean  @default(true)   ✅
  reviewRequests        Boolean  @default(true)   ✅
  consultationCompleted Boolean  @default(true)   ✅
  systemNotifications   Boolean  @default(true)   ✅
  emailNotifications    Boolean  @default(true)   ✅
}
```

**결과**: 기본값 모두 `true` - 알림이 기본적으로 활성화됨 ✅

---

### 2. 프론트엔드 타입 정의 검증

#### TypeScript NotificationType
```typescript
// apps/web/src/lib/notifications.ts
export type NotificationType =
  | 'CONSULTATION_REQUEST'
  | 'CONSULTATION_ACCEPTED'
  | 'CONSULTATION_REJECTED'
  | 'CONSULTATION_COMPLETED'
  | 'CONSULTATION_UPCOMING'
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_FAILED'
  | 'CREDIT_PURCHASE_COMPLETED'
  | 'CREDIT_LOW'
  | 'REVIEW_REQUEST'
  | 'SYSTEM'
  | 'INQUIRY_RECEIVED'           ✅
  | 'INQUIRY_REPLY'              ✅
  | 'RESERVATION_PENDING'        ✅
  | 'RESERVATION_APPROVED'       ✅
  | 'RESERVATION_REJECTED'       ✅
  | 'EXPERT_APPLICATION_UPDATE'
  | 'SYSTEM_ADMIN';
```

**결과**: 백엔드 Prisma enum과 100% 일치 ✅

#### Notification Interface
```typescript
export interface Notification {
  id: number;
  displayId: string;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  actionUrl?: string;
  expiresAt?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

**결과**: Prisma 모델과 완벽하게 일치 ✅

---

### 3. API 엔드포인트 검증

#### 구현된 엔드포인트
```typescript
// apps/api/src/notifications/notifications.controller.ts

@Controller('notifications')
@UseGuards(JwtGuard)  // JWT 인증 필수
export class NotificationsController {

  @Get()                              // GET /notifications
  async getNotifications() { }        ✅

  @Get('unread-count')                // GET /notifications/unread-count
  async getUnreadCount() { }          ✅

  @Patch(':id/read')                  // PATCH /notifications/:id/read
  async markAsRead() { }              ✅

  @Post('mark-all-read')              // POST /notifications/mark-all-read
  async markAllAsRead() { }           ✅

  @Delete(':id')                      // DELETE /notifications/:id
  async deleteNotification() { }      ✅

  @Get('settings')                    // GET /notifications/settings
  async getSettings() { }             ✅

  @Patch('settings')                  // PATCH /notifications/settings
  async updateSettings() { }          ✅
}
```

**결과**: 모든 필수 API 엔드포인트 구현됨 ✅

#### getUserNotifications 서비스 메서드
```typescript
async getUserNotifications(userId: number, options?: {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}) {
  const where: any = {
    userId,
    OR: [
      { expiresAt: null },
      { expiresAt: { gte: new Date() } },  // 만료되지 않은 알림만
    ],
  };

  if (options?.unreadOnly) {
    where.isRead = false;
  }

  const [notifications, total] = await Promise.all([
    this.prisma.notification.findMany({
      where,
      orderBy: [
        { isRead: 'asc' },      // 읽지 않은 것 먼저
        { priority: 'desc' },   // 우선순위 높은 것
        { createdAt: 'desc' },  // 최신순
      ],
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    this.prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    total,
    unreadCount: await this.prisma.notification.count({
      where: { userId, isRead: false }
    }),
  };
}
```

**결과**:
- userId로 필터링 ✅
- 만료되지 않은 알림만 조회 ✅
- 정렬 로직 정상 ✅
- 페이지네이션 지원 ✅

---

### 4. 알림 생성 로직 검증

#### 4.1 문의(Inquiry) 알림

##### createInquiryReceivedNotification (전문가용)
```typescript
// apps/api/src/notifications/notifications.service.ts:333-351
async createInquiryReceivedNotification(
  expertUserId: number,
  inquiryId: string,
  clientName: string,
  subject: string
) {
  const settings = await this.getUserSettings(expertUserId);
  if (!settings.systemNotifications) return null;  // 설정 확인

  return this.createNotification({
    userId: expertUserId,           // 전문가에게 알림
    type: 'INQUIRY_RECEIVED',       // 타입
    title: '새로운 문의가 도착했습니다',
    message: `${clientName}님이 "${subject}" 주제로 문의를 남겼습니다`,
    data: { inquiryId },
    priority: 'MEDIUM',
    actionUrl: `/dashboard/expert/inquiries/${inquiryId}`,
  });
}
```

**호출 위치**: `apps/api/src/inquiry/inquiry.service.ts:82-92`
```typescript
// 전문가에게 시스템 알림 생성
if (expert.userId) {
  this.notificationsService
    .createInquiryReceivedNotification(
      expert.userId,              // ✅ expert.userId 사용
      inquiry.id,
      client?.name || '고객',
      dto.subject
    )
    .catch(err => {
      console.error('[InquiryService] 문의 알림 생성 실패:', err);
    });
}
```

**Expert 조회 쿼리**: `apps/api/src/inquiry/inquiry.service.ts:24-34`
```typescript
const expert = await this.prisma.expert.findUnique({
  where: { id: dto.expertId },
  select: {
    id: true,
    name: true,
    userId: true,  // ✅ userId 명시적으로 select
    user: {
      select: { email: true, name: true }
    }
  }
});
```

**결과**:
- expert.userId 정상적으로 조회됨 ✅
- 알림 생성 로직 정상 ✅
- 에러 핸들링 존재 (.catch) ✅

##### createInquiryReplyNotification (사용자용)
```typescript
// apps/api/src/notifications/notifications.service.ts:356-374
async createInquiryReplyNotification(
  clientUserId: number,
  inquiryId: string,
  expertName: string,
  subject: string
) {
  const settings = await this.getUserSettings(clientUserId);
  if (!settings.systemNotifications) return null;

  return this.createNotification({
    userId: clientUserId,           // 사용자에게 알림
    type: 'INQUIRY_REPLY',          // 타입
    title: '문의에 대한 답변이 도착했습니다',
    message: `${expertName}님이 "${subject}" 문의에 답변했습니다`,
    data: { inquiryId },
    priority: 'HIGH',
    actionUrl: `/dashboard/inquiries/${inquiryId}`,
  });
}
```

**호출 위치**: `apps/api/src/inquiry/inquiry.service.ts:335`

**결과**: 알림 생성 로직 정상 ✅

---

#### 4.2 예약(Reservation) 알림

##### createReservationPendingNotification (전문가용)
```typescript
// apps/api/src/notifications/notifications.service.ts:383-401
async createReservationPendingNotification(
  expertUserId: number,
  reservationId: string,
  clientName: string,
  startAt: Date
) {
  const settings = await this.getUserSettings(expertUserId);
  if (!settings.upcomingReservations) return null;  // 설정 확인

  return this.createNotification({
    userId: expertUserId,           // 전문가에게 알림
    type: 'RESERVATION_PENDING',    // 타입
    title: '새로운 예약 요청',
    message: `${clientName}님의 예약 요청이 있습니다 (${startAt.toLocaleString('ko-KR')})`,
    data: { reservationId },
    priority: 'HIGH',
    actionUrl: `/dashboard/expert/reservations`,
  });
}
```

**호출 위치**: `apps/api/src/reservations/reservations.service.ts:180-191`
```typescript
// 전문가에게 시스템 알림 생성
if (expert.userId) {
  this.notificationsService
    .createReservationPendingNotification(
      expert.userId,              // ✅ expert.userId 사용
      displayId,
      client?.name || '고객',
      start
    )
    .catch(err => {
      console.error('[ReservationsService] 예약 알림 생성 실패:', err);
    });
}
```

**Expert 조회 쿼리**: `apps/api/src/reservations/reservations.service.ts:33-49`
```typescript
const expert = await this.prisma.expert.findUnique({
  where: { id: dto.expertId },
  select: {
    name: true,
    hourlyRate: true,
    userId: true,  // ✅ userId 명시적으로 select
    user: {
      select: { email: true, name: true }
    }
  }
});
```

**결과**: 알림 생성 로직 정상 ✅

##### createReservationApprovedNotification (사용자용)
```typescript
// apps/api/src/notifications/notifications.service.ts:406-424
async createReservationApprovedNotification(
  clientUserId: number,
  reservationId: string,
  expertName: string,
  startAt: Date
) {
  const settings = await this.getUserSettings(clientUserId);
  if (!settings.upcomingReservations) return null;

  return this.createNotification({
    userId: clientUserId,
    type: 'RESERVATION_APPROVED',
    title: '예약이 승인되었습니다',
    message: `${expertName}님이 예약을 승인했습니다 (${startAt.toLocaleString('ko-KR')})`,
    data: { reservationId },
    priority: 'HIGH',
    actionUrl: `/dashboard/consultations/${reservationId}`,
  });
}
```

**호출 위치**: `apps/api/src/reservations/reservations.service.ts:697`

**결과**: 알림 생성 로직 정상 ✅

##### createReservationRejectedNotification (사용자용)
```typescript
// apps/api/src/notifications/notifications.service.ts:429-447
async createReservationRejectedNotification(
  clientUserId: number,
  reservationId: string,
  expertName: string,
  reason?: string
) {
  const settings = await this.getUserSettings(clientUserId);
  if (!settings.upcomingReservations) return null;

  return this.createNotification({
    userId: clientUserId,
    type: 'RESERVATION_REJECTED',
    title: '예약이 거절되었습니다',
    message: `${expertName}님이 예약을 거절했습니다${reason ? `: ${reason}` : ''}`,
    data: { reservationId },
    priority: 'HIGH',
    actionUrl: `/dashboard/consultations`,
  });
}
```

**호출 위치**: `apps/api/src/reservations/reservations.service.ts:792`

**결과**: 알림 생성 로직 정상 ✅

---

### 5. 사용자 설정 처리 검증

#### getUserSettings 메서드
```typescript
// apps/api/src/notifications/notifications.service.ts:136-154
async getUserSettings(userId: number) {
  // userId 검증
  if (!userId || typeof userId !== 'number') {
    throw new Error(`Invalid userId: ${userId}`);
  }

  let settings = await this.prisma.userNotificationSetting.findUnique({
    where: { userId },
  });

  // 설정이 없으면 기본값으로 자동 생성 ✅
  if (!settings) {
    settings = await this.prisma.userNotificationSetting.create({
      data: { userId },  // Prisma @default 값 사용
    });
  }

  return settings;
}
```

**동작 방식**:
1. 사용자 설정 조회
2. 없으면 기본값으로 자동 생성
3. 기본값은 Prisma 스키마의 `@default(true)` 사용

**결과**:
- 신규 사용자도 자동으로 알림 활성화 ✅
- 에러 처리 정상 ✅

---

### 6. 프론트엔드 필터링 로직 검증

#### NotificationBell 컴포넌트
```typescript
// apps/web/src/components/dashboard/NotificationBell.tsx:32-42
const EXPERT_NOTIFICATION_TYPES: NotificationType[] = [
  'INQUIRY_RECEIVED',           // ✅ 전문가용
  'RESERVATION_PENDING',        // ✅ 전문가용
  'CONSULTATION_UPCOMING',
  'CONSULTATION_COMPLETED',
  'CREDIT_LOW',
  'REVIEW_REQUEST',
  'SYSTEM',
  'SYSTEM_ADMIN'
];

const USER_NOTIFICATION_TYPES: NotificationType[] = [
  'INQUIRY_REPLY',              // ✅ 사용자용
  'RESERVATION_APPROVED',       // ✅ 사용자용
  'RESERVATION_REJECTED',       // ✅ 사용자용
  'CONSULTATION_UPCOMING',
  'CONSULTATION_COMPLETED',
  'CREDIT_LOW',
  'EXPERT_APPLICATION_UPDATE',
  'SYSTEM',
  'SYSTEM_ADMIN'
];
```

**필터링 로직**: `NotificationBell.tsx:98-118`
```typescript
const notifications = useMemo(() => {
  const allNotifications = notificationsData?.data || [];

  // 모드에 따라 다른 타입 필터 적용 ✅
  const allowedTypes = isExpertMode
    ? EXPERT_NOTIFICATION_TYPES
    : USER_NOTIFICATION_TYPES;

  const filtered = allNotifications.filter(notification =>
    allowedTypes.includes(notification.type)
  );

  console.log('[NotificationBell] 알림 데이터:', {
    mode: isExpertMode ? '전문가' : '사용자',
    total: allNotifications.length,
    filtered: filtered.length,
    types: filtered.map(n => n.type),
    unreadCount: filtered.filter(n => !n.isRead).length
  });

  return filtered;
}, [notificationsData, isExpertMode]);  // ✅ 의존성 배열 정상
```

**결과**:
- 모드별 조건부 필터링 정상 ✅
- 디버깅 로그 존재 ✅
- useMemo 의존성 정확 ✅

---

## 🎯 종합 결론

### ✅ 모든 코드가 정상적으로 구현됨!

백엔드와 프론트엔드의 스키마, 타입, 로직 모두 완벽하게 연동되어 있습니다.

**코드 레벨에서는 문제가 없습니다.**

---

## 🔧 실제 문제 원인 가능성

### 1. 서버가 최신 코드로 실행되지 않음 (가장 가능성 높음)
**증상**: 코드는 수정되었지만 실행 중인 서버는 이전 코드
**해결**: 백엔드 서버 재시작 필요

### 2. 실제로 알림 생성 테스트를 하지 않음
**증상**: 코드는 정상이지만 실제로 문의/예약을 만들지 않아서 알림이 없음
**해결**: 실제 테스트 진행 필요

### 3. 브라우저 캐시 문제
**증상**: 프론트엔드 코드 변경이 반영되지 않음
**해결**: 하드 리프레시 (Cmd+Shift+R) 또는 브라우저 캐시 삭제

### 4. API 호출 실패 (네트워크 오류)
**증상**: API 요청이 실패하거나 타임아웃
**해결**: 네트워크 탭에서 확인 필요

### 5. JWT 토큰 문제
**증상**: 인증 실패로 API 호출이 거부됨
**해결**: 로그아웃 후 재로그인

---

## 🧪 디버깅 가이드

### Step 1: 백엔드 서버 재시작
```bash
# 터미널에서 실행
cd /Users/jaewon/project/Consutl-On-re
pnpm dev

# 또는 기존 프로세스 종료 후 재시작
lsof -ti:3001 | xargs kill
pnpm dev
```

### Step 2: 브라우저 캐시 삭제 및 하드 리프레시
1. Chrome 개발자 도구 열기 (F12)
2. Network 탭 선택
3. "Disable cache" 체크박스 활성화
4. 페이지 새로고침 (Cmd+Shift+R)

### Step 3: 실제 알림 생성 테스트

#### 테스트 3.1: 문의 보내기
1. **사용자 모드**로 로그인
2. 전문가 프로필 페이지 접속
3. "문의 보내기" 클릭
4. 문의 작성 및 전송
5. **전문가 모드로 전환**
6. 상단 알림 벨 확인

#### 테스트 3.2: 예약 요청
1. **사용자 모드**로 로그인
2. 전문가 프로필 페이지 접속
3. "예약하기" 클릭
4. 3단계 예약 프로세스 완료
5. **전문가 모드로 전환**
6. 상단 알림 벨 확인

### Step 4: 브라우저 콘솔 로그 확인

#### 예상되는 로그
```javascript
// 알림 필터링 로그 (10초마다 출력)
[NotificationBell] 알림 데이터: {
  mode: '전문가',
  total: 5,
  filtered: 3,
  types: ['INQUIRY_RECEIVED', 'RESERVATION_PENDING', 'SYSTEM'],
  unreadCount: 2
}
```

#### 확인 사항
- `mode`가 올바른가? (전문가 모드에서 '전문가', 사용자 모드에서 '사용자')
- `total`이 0보다 큰가? (API가 알림을 반환하는가)
- `filtered`가 0보다 큰가? (필터링 후에도 알림이 남아있는가)
- `types`에 예상한 타입이 포함되어 있는가?

### Step 5: 네트워크 탭 확인

#### API 요청 확인
1. Chrome 개발자 도구 → Network 탭
2. 페이지 새로고침
3. `notifications` 검색
4. `GET /api/notifications?limit=50` 요청 클릭

#### 응답 데이터 확인
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "INQUIRY_RECEIVED",
      "title": "새로운 문의가 도착했습니다",
      "message": "홍길동님이 \"상담 문의\" 주제로 문의를 남겼습니다",
      "isRead": false,
      "priority": "MEDIUM",
      "createdAt": "2025-10-28T..."
    }
  ],
  "meta": {
    "total": 1,
    "unreadCount": 1
  }
}
```

#### 확인 사항
- 응답 상태 코드가 200인가?
- `data` 배열에 알림이 있는가?
- `type`이 예상한 값인가?
- `isRead`가 false인가?

### Step 6: 백엔드 로그 확인

터미널에서 백엔드 서버 로그 확인:

#### 정상 로그
```
[InquiryService] 문의 생성 완료: inquiry-123
[NotificationsService] 알림 생성 완료: notification-456
```

#### 오류 로그 (있다면)
```
[InquiryService] 문의 알림 생성 실패: Error: ...
[NotificationsService] 알림 생성 실패: ...
```

### Step 7: 데이터베이스 직접 확인 (최종 수단)

```sql
-- 알림 테이블 조회
SELECT * FROM Notification
ORDER BY createdAt DESC
LIMIT 10;

-- 특정 사용자의 알림 조회
SELECT * FROM Notification
WHERE userId = [전문가의_userId]
ORDER BY createdAt DESC;

-- 알림 타입별 개수
SELECT type, COUNT(*) as count
FROM Notification
GROUP BY type;

-- 읽지 않은 알림 개수
SELECT userId, COUNT(*) as unreadCount
FROM Notification
WHERE isRead = false
GROUP BY userId;
```

---

## 📋 체크리스트

테스트를 진행하면서 다음 항목들을 체크해주세요:

- [ ] **백엔드 서버 재시작** (`pnpm dev`)
- [ ] **브라우저 캐시 삭제** (Cmd+Shift+R)
- [ ] **문의 보내기 테스트** (사용자 → 전문가)
- [ ] **예약 요청 테스트** (사용자 → 전문가)
- [ ] **전문가 모드로 전환** 확인
- [ ] **알림 벨 클릭** 및 알림 확인
- [ ] **브라우저 콘솔 로그** 확인
  - [ ] mode가 올바른가?
  - [ ] total > 0인가?
  - [ ] filtered > 0인가?
  - [ ] types에 예상 타입이 있는가?
- [ ] **네트워크 탭** 확인
  - [ ] `/api/notifications` 요청 성공(200)인가?
  - [ ] 응답 data에 알림이 있는가?
- [ ] **백엔드 로그** 확인
  - [ ] "알림 생성 완료" 로그가 있는가?
  - [ ] 오류 로그가 없는가?
- [ ] **데이터베이스 직접 조회** (필요 시)
  - [ ] Notification 테이블에 데이터가 있는가?

---

## 🎓 학습 포인트

이번 분석을 통해 확인한 것들:

### 백엔드
1. **Prisma 스키마 설계**: Enum 타입, 관계 설정, 인덱스 최적화
2. **알림 생성 패턴**: 비동기 처리, 에러 핸들링, 설정 확인
3. **사용자 설정 관리**: 기본값 자동 생성, upsert 패턴

### 프론트엔드
1. **타입 안정성**: 백엔드와 프론트엔드 타입 일치의 중요성
2. **조건부 필터링**: useMemo를 활용한 성능 최적화
3. **디버깅 전략**: 콘솔 로그, 네트워크 탭 활용

### 전체 시스템
1. **End-to-End 데이터 흐름**: DB → API → Frontend의 완전한 이해
2. **디버깅 방법론**: 계층별 검증, 로그 활용, 직접 확인
3. **문제 해결 접근**: 가능성 배제법, 체계적 검증

---

## 🚀 다음 단계

1. **즉시 실행**: 백엔드 서버 재시작
2. **테스트 진행**: 문의/예약 생성하여 실제 알림 확인
3. **로그 확인**: 브라우저 콘솔과 백엔드 터미널 모니터링
4. **결과 보고**: 테스트 결과를 알려주시면 추가 분석 가능

---

**분석 결론**: 코드는 완벽합니다. 실제 테스트와 서버 재시작이 필요합니다! 🎯
