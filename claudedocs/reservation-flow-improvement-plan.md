# 전문가 상담 예약 플로우 분석 및 개선 계획

## 📋 현재 플로우 분석

### 1. 사용자 예약 플로우
```
전문가 프로필 페이지 (ExpertProfileDetail.tsx)
  ↓
"상담 예약하기" 버튼 클릭 (라인 1009 또는 931)
  ↓
ReservationModal 열림 (라인 1242-1254)
  ↓
날짜/시간/상담길이 선택 + 요청사항 입력
  ↓
크레딧 잔액 확인 (실시간 조회)
  ↓
"예약하기" 버튼 클릭
  ↓
POST /v1/reservations API 호출
  ↓
Backend 처리 (reservations.service.ts)
  ↓
성공 시 토스트 메시지 표시
```

### 2. Backend 예약 생성 로직
```typescript
// reservations.service.ts - create 메서드
1. 시간 유효성 검증 (endAt > startAt)
2. 전문가 정보 조회
3. 전문가 레벨별 크레딧 계산 (실시간)
4. 예약 길이(분) 계산 및 총 비용 산출
5. 사용자 크레딧 잔액 확인
6. 트랜잭션 시작
   - 예약 생성 (status: PENDING)
   - 크레딧 차감 기록
7. 중복 예약 에러 처리 (P2002)
```

### 3. 관련 파일
- **Frontend**
  - `apps/web/src/components/experts/ExpertProfileDetail.tsx` - 전문가 프로필 상세
  - `apps/web/src/components/reservation/ReservationModal.tsx` - 예약 모달 (사용 중)
  - `apps/web/src/features/reservations/ReservationForm.tsx` - 예약 폼 (사용 여부 불명)

- **Backend**
  - `apps/api/src/reservations/reservations.controller.ts` - 예약 API 엔드포인트
  - `apps/api/src/reservations/reservations.service.ts` - 예약 비즈니스 로직
  - `database/16_reservations.sql` - 예약 데이터 스키마

---

## 🚨 주요 문제점

### Critical Issues

#### 1. 예약 가능 시간 검증 부재 ⚠️
**문제:**
- 전문가의 `availabilitySlots`는 UI에만 표시됨
- 실제 예약 시 전문가의 근무 시간 검증 없음
- 사용자가 9:00-21:00 범위 내 임의의 시간 선택 가능

**영향:**
- 전문가가 근무하지 않는 시간에 예약 가능
- 전문가와 사용자 간 혼란 초래

**해결 방안:**
```typescript
// Backend: reservations.service.ts
async validateAvailability(expertId: number, startAt: Date, endAt: Date) {
  // 1. 요일 및 시간 추출
  const dayOfWeek = getDayOfWeek(startAt);
  const startTime = getTimeString(startAt);
  const endTime = getTimeString(endAt);

  // 2. 전문가의 해당 요일 예약 가능 시간 조회
  const slots = await prisma.availabilitySlot.findMany({
    where: {
      expertId,
      dayOfWeek,
      startTime: { lte: startTime },
      endTime: { gte: endTime }
    }
  });

  // 3. 매칭되는 슬롯이 없으면 에러
  if (slots.length === 0) {
    throw new BadRequestException('전문가가 예약 가능한 시간이 아닙니다');
  }
}
```

#### 2. 기존 예약 시간 충돌 체크 미흡 ⚠️
**문제:**
- P2002 에러 처리만 있고 사전 검증 없음
- 실제로 시간 범위 겹침 체크 로직 부재
- 동시 예약 요청 시 충돌 가능

**영향:**
- 같은 시간대에 중복 예약 발생 가능
- 데이터 무결성 문제

**해결 방안:**
```typescript
async checkTimeConflict(expertId: number, startAt: Date, endAt: Date, excludeId?: string) {
  const conflicts = await prisma.reservation.findFirst({
    where: {
      expertId,
      displayId: { not: excludeId },
      status: { in: ['PENDING', 'CONFIRMED'] },
      OR: [
        {
          // 기존 예약이 새 예약 시작 시간을 포함
          AND: [
            { startAt: { lte: startAt } },
            { endAt: { gt: startAt } }
          ]
        },
        {
          // 기존 예약이 새 예약 종료 시간을 포함
          AND: [
            { startAt: { lt: endAt } },
            { endAt: { gte: endAt } }
          ]
        },
        {
          // 새 예약이 기존 예약을 완전히 포함
          AND: [
            { startAt: { gte: startAt } },
            { endAt: { lte: endAt } }
          ]
        }
      ]
    }
  });

  if (conflicts) {
    throw new ConflictException('해당 시간에 이미 예약이 있습니다');
  }
}
```

#### 3. 전문가 승인 플로우 부재 ⚠️
**문제:**
- 예약이 PENDING 상태로 생성되지만 승인/거절 API 없음
- 전문가가 예약 요청을 관리할 방법 없음

**영향:**
- 예약이 자동으로 확정되는지 불명확
- 전문가의 일정 통제권 부족

**해결 방안:**
```typescript
// Controller
@Patch(':displayId/approve')
async approve(@Param('displayId') displayId: string, @Request() req) {
  // 전문가 권한 확인
  const data = await this.svc.approve(displayId, req.user.expertId);
  return { success: true, data };
}

@Patch(':displayId/reject')
async reject(
  @Param('displayId') displayId: string,
  @Body() body: { reason?: string },
  @Request() req
) {
  const data = await this.svc.reject(displayId, req.user.expertId, body.reason);
  return { success: true, data };
}

// Service
async approve(displayId: string, expertId: number) {
  const reservation = await this.findAndValidate(displayId, expertId);

  return this.prisma.reservation.update({
    where: { displayId },
    data: {
      status: 'CONFIRMED',
      confirmedAt: new Date()
    }
  });
}

async reject(displayId: string, expertId: number, reason?: string) {
  const reservation = await this.findAndValidate(displayId, expertId);

  return this.prisma.$transaction(async (tx) => {
    // 1. 예약 거절 처리
    const updated = await tx.reservation.update({
      where: { displayId },
      data: {
        status: 'REJECTED',
        cancelReason: reason
      }
    });

    // 2. 크레딧 환불
    await tx.creditTransaction.create({
      data: {
        userId: reservation.userId,
        amount: reservation.cost,
        reason: 'refund:rejected',
        refId: displayId
      }
    });

    return updated;
  });
}
```

### High Priority Issues

#### 4. 타임슬롯 선택 UX 부족 📱
**문제:**
- 드롭다운으로 시간 선택 (9:00-21:00, 30분 단위)
- 전문가의 실제 예약 가능 시간과 무관
- 이미 예약된 시간도 선택 가능

**개선 방안:**
```tsx
// AvailableTimeSlotsCalendar.tsx (새 컴포넌트)
interface TimeSlot {
  time: string;
  available: boolean;
  reserved: boolean;
}

export default function AvailableTimeSlotsCalendar({
  expertId,
  selectedDate,
  onSelectSlot
}: Props) {
  const { data: slots } = useQuery({
    queryKey: ['available-slots', expertId, selectedDate],
    queryFn: () => api.get(`/experts/${expertId}/available-slots`, {
      params: { date: selectedDate }
    })
  });

  return (
    <div className="grid grid-cols-4 gap-2">
      {slots?.map(slot => (
        <button
          key={slot.time}
          disabled={!slot.available || slot.reserved}
          onClick={() => onSelectSlot(slot.time)}
          className={`
            p-2 rounded border
            ${slot.reserved ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}
            ${slot.available && !slot.reserved ? 'hover:bg-blue-50 border-blue-300' : ''}
          `}
        >
          {slot.time}
          {slot.reserved && <span className="text-xs block">예약됨</span>}
        </button>
      ))}
    </div>
  );
}
```

#### 5. 취소 정책 미구현 📋
**문제:**
- UI에 "24시간 전 취소 가능" 표시
- 실제 취소 시 시간 제한 검증 없음
- 크레딧은 전액 환불됨

**해결 방안:**
```typescript
async cancel(displayId: string, userId: number) {
  const reservation = await this.prisma.reservation.findUnique({
    where: { displayId },
    include: { expert: { select: { cancellationPolicy: true } } }
  });

  if (!reservation) {
    throw new NotFoundException('예약을 찾을 수 없습니다');
  }

  // 취소 정책 확인 (24시간 전)
  const hoursUntilStart = (reservation.startAt.getTime() - Date.now()) / (1000 * 60 * 60);
  const cancellationHours = 24; // 또는 expert.cancellationPolicy에서 추출

  let refundAmount = reservation.cost;
  let refundReason = 'refund:reservation';

  if (hoursUntilStart < cancellationHours) {
    // 24시간 이내 취소: 50% 환불
    refundAmount = Math.floor(reservation.cost * 0.5);
    refundReason = 'refund:partial';
  }

  return this.prisma.$transaction(async (tx) => {
    const updated = await tx.reservation.update({
      where: { displayId },
      data: {
        status: 'CANCELED',
        canceledBy: userId,
        canceledAt: new Date(),
        refundAmount
      }
    });

    if (refundAmount > 0) {
      await tx.creditTransaction.create({
        data: {
          userId,
          amount: refundAmount,
          reason: refundReason,
          refId: displayId
        }
      });
    }

    return updated;
  });
}
```

#### 6. 크레딧 정보 표시 개선 💰
**문제:**
- 모달을 열어야만 크레딧 잔액 확인 가능
- 크레딧 부족 시 안내 부족

**개선 방안:**
```tsx
// ExpertProfileDetail.tsx
const { data: userCredits } = useQuery({
  queryKey: ['user-credits', user?.id],
  queryFn: () => api.get(`/credits/balance?userId=${user?.id}`),
  enabled: !!user?.id && !isOwner
});

// 사이드바 예약 카드에 크레딧 정보 추가
<Card>
  <h3>상담 예약</h3>
  <div className="text-center p-4 bg-blue-50 rounded-lg">
    <p className="text-lg font-bold">{creditsPerMinute} 크레딧</p>
    <p className="text-sm">분당</p>
  </div>

  {/* 크레딧 잔액 표시 */}
  <div className="bg-gray-50 p-3 rounded-lg mt-3">
    <div className="flex justify-between text-sm">
      <span>내 크레딧</span>
      <span className="font-medium">
        {userCredits?.data?.toLocaleString() || 0} 크레딧
      </span>
    </div>
    {userCredits?.data < creditsPerMinute * 30 && (
      <p className="text-xs text-red-600 mt-2">
        크레딧이 부족합니다
      </p>
    )}
  </div>

  {userCredits?.data >= creditsPerMinute * 30 ? (
    <Button onClick={handleConsultationRequest}>
      상담 예약하기
    </Button>
  ) : (
    <Button onClick={() => router.push('/credits/charge')}>
      크레딧 충전하기
    </Button>
  )}
</Card>
```

### Medium Priority Issues

#### 7. 예약 확인 단계 부재 ✅
**문제:**
- 선택 후 바로 예약 생성
- 최종 확인 단계 없음

**개선 방안:**
- 2단계 모달로 변경
- 1단계: 날짜/시간 선택
- 2단계: 예약 정보 확인 + 최종 결제

#### 8. 중복 코드 존재 🔧
**문제:**
- `ReservationModal.tsx`와 `ReservationForm.tsx` 중복
- 어떤 컴포넌트를 사용해야 할지 불명확

**해결 방안:**
- 사용하지 않는 컴포넌트 제거
- 또는 통합하여 하나의 컴포넌트로 관리

---

## 🎯 개선 계획

### Phase 1: Critical Fixes (즉시 필요)

#### Backend
1. **예약 가능 시간 검증 API 추가**
   - `GET /experts/:id/available-slots?date=YYYY-MM-DD`
   - 전문가의 availabilitySlots와 기존 예약을 고려한 실제 예약 가능 시간 반환

2. **예약 생성 시 검증 로직 강화**
   - `validateAvailability()` 메서드 추가
   - `checkTimeConflict()` 메서드 추가
   - create() 메서드에 검증 추가

3. **예약 승인/거절 API 구현**
   - `PATCH /reservations/:displayId/approve`
   - `PATCH /reservations/:displayId/reject`
   - 전문가 권한 확인 미들웨어

#### Frontend
4. **타임슬롯 선택 UI 개선**
   - 캘린더 + 타임슬롯 그리드 컴포넌트
   - 실시간 예약 가능 시간 조회
   - 예약된 시간 비활성화 표시

5. **전문가 예약 관리 대시보드**
   - 예약 요청 목록
   - 승인/거절 버튼
   - 예약 일정 캘린더

#### 예상 작업 시간
- Backend: 2-3일
- Frontend: 3-4일
- 총: 5-7일

---

### Phase 2: UX Improvements (중요한 개선)

#### Backend
1. **취소 정책 검증 구현**
   - 시간 기반 환불 금액 계산
   - canceledBy, canceledAt, refundAmount 필드 활용

2. **예약 통계 API**
   - 전문가별 예약 완료율
   - 사용자별 예약 이력

#### Frontend
3. **예약 확인 단계 추가**
   - 2단계 모달: 선택 → 확인
   - 최종 비용 및 정보 재확인

4. **크레딧 정보 사전 표시**
   - 프로필 페이지에서 크레딧 잔액 표시
   - 크레딧 부족 시 충전 페이지 링크

5. **예약 상태 관리 페이지**
   - 사용자: 내 예약 목록
   - 필터링 (예정/완료/취소)
   - 예약 상세 모달

#### 예상 작업 시간
- Backend: 2일
- Frontend: 3-4일
- 총: 5-6일

---

### Phase 3: Enhancements (편의성)

1. **알림 시스템 구축**
   - 예약 생성/승인/거절 알림
   - 예약 1시간 전 리마인더
   - 이메일 또는 푸시 알림

2. **Idempotency Key 구현**
   - Redis 기반 중복 요청 방지
   - 2-5분 캐싱

3. **에러 처리 개선**
   - 시간 충돌 시 대체 시간 제안
   - 네트워크 에러 재시도 로직

4. **데이터베이스 개선**
   - 예약 상태 확장 (REJECTED, COMPLETED, NO_SHOW)
   - ReservationHistory 테이블 추가
   - 인덱스 최적화

#### 예상 작업 시간
- Backend: 3-4일
- Frontend: 2-3일
- 총: 5-7일

---

### Phase 4: Optimization (최적화)

1. **실시간 업데이트**
   - WebSocket 기반 실시간 알림
   - 예약 상태 변경 즉시 반영

2. **성능 최적화**
   - 복합 인덱스 추가
   - 쿼리 최적화
   - 캐싱 전략

3. **코드 정리**
   - 불필요한 컴포넌트 제거
   - 중복 코드 통합

#### 예상 작업 시간
- 3-4일

---

## 📊 데이터베이스 스키마 개선안

### 1. Reservation 테이블 필드 추가
```sql
ALTER TABLE Reservation
ADD COLUMN confirmedAt TIMESTAMP,
ADD COLUMN canceledBy INTEGER,
ADD COLUMN canceledAt TIMESTAMP,
ADD COLUMN cancelReason TEXT,
ADD COLUMN refundAmount INTEGER DEFAULT 0;

-- 상태 enum 확장
ALTER TYPE ReservationStatus ADD VALUE 'REJECTED';
ALTER TYPE ReservationStatus ADD VALUE 'COMPLETED';
ALTER TYPE ReservationStatus ADD VALUE 'NO_SHOW';
```

### 2. ReservationHistory 테이블 생성
```sql
CREATE TABLE ReservationHistory (
  id SERIAL PRIMARY KEY,
  reservationId INTEGER NOT NULL REFERENCES Reservation(id),
  fromStatus ReservationStatus NOT NULL,
  toStatus ReservationStatus NOT NULL,
  changedBy INTEGER NOT NULL REFERENCES User(id),
  reason TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reservation_history_reservation
ON ReservationHistory(reservationId);
```

### 3. 인덱스 최적화
```sql
-- 시간 충돌 검색 최적화
CREATE INDEX idx_reservation_expert_time
ON Reservation(expertId, startAt, endAt, status);

-- 사용자별 예약 조회 최적화
CREATE INDEX idx_reservation_user_status
ON Reservation(userId, status, createdAt DESC);
```

---

## 🚀 구현 우선순위 요약

### 즉시 구현 (이번 주)
1. ✅ 예약 가능 시간 검증 (Backend)
2. ✅ 시간 충돌 체크 (Backend)
3. ✅ 예약 승인/거절 API (Backend)
4. ✅ 타임슬롯 선택 UI (Frontend)

### 다음 스프린트 (다음 주)
5. ✅ 예약 확인 단계 추가 (Frontend)
6. ✅ 크레딧 정보 사전 표시 (Frontend)
7. ✅ 취소 정책 구현 (Backend)
8. ✅ 예약 관리 페이지 (Frontend)

### 이후 개선
9. 알림 시스템
10. Idempotency Key
11. 실시간 업데이트
12. 성능 최적화

---

## 📝 결론

현재 예약 시스템은 기본적인 기능은 동작하지만, **예약 가능 시간 검증**, **시간 충돌 방지**, **전문가 승인 프로세스**가 부재하여 실제 프로덕션 환경에서 문제가 발생할 수 있습니다.

**Phase 1**의 Critical Fixes를 먼저 구현하여 시스템의 신뢰성을 확보하고, 이후 단계적으로 UX와 편의성을 개선하는 것을 권장합니다.

**예상 전체 개발 기간:** 3-4주
**최소 동작 가능 버전 (Phase 1):** 1주
