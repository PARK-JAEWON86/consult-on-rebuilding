# 예약 모달 Availability 404 에러 수정

## 문제 분석 일시
2025-10-26

## 문제 상황
예약 정보 확인 페이지에서 예약 요청 시 브라우저 콘솔에 404 에러 발생:
```
Failed to load resource: the server responded with a status of 404 (Not Found)
:4000/v1/experts/EXP…4172/availability:1
```

## 근본 원인

### 1. API 엔드포인트 권한 문제
**위치**: `apps/api/src/experts/experts.controller.ts:208-234`

```typescript
@Get(':displayId/availability')
@UseGuards(JwtGuard)  // ← 인증 필요
async getAvailability(
  @Param('displayId') displayId: string,
  @Request() req: any
) {
  const userId = req.user.id;

  // 권한 검증: 본인의 데이터만 조회 가능
  const expert = await this.svc.findByDisplayId(displayId);
  if (!expert || (expert as any).userId !== userId) {
    throw new NotFoundException({  // ← 404 발생!
      success: false,
      error: {
        code: 'E_UNAUTHORIZED',
        message: 'You can only view your own availability'
      }
    });
  }

  const data = await this.svc.getAvailabilitySlots(displayId);

  return {
    success: true,
    data
  };
}
```

**문제점**:
- 이 엔드포인트는 **전문가 본인만** 자신의 availability를 조회할 수 있음
- 일반 사용자(예약자)가 전문가의 공휴일/휴무 설정을 조회하려 하면 권한 없음으로 `NotFoundException` (404) 발생
- `ReservationModalImproved.tsx`에서 예약하려는 일반 사용자가 이 API를 호출하면 실패

### 2. 중복된 데이터 조회
**기존 프로필 API**는 이미 availability 정보를 포함하고 있음:

`apps/api/src/experts/experts.service.ts:964-1034` (`getExpertProfile` 메서드):
```typescript
async getExpertProfile(displayId: string) {
  // ... expert 조회 ...

  // availabilitySlots 조회 (ExpertAvailability 테이블에서)
  const availabilitySlots = await this.prisma.expertAvailability.findMany({
    where: { expertId: expert.id },
    orderBy: [
      { dayOfWeek: 'asc' },
      { startTime: 'asc' }
    ]
  });

  // holidaySettings와 restTimeSettings 추출
  const availabilityData = expert.availability as any;
  const holidaySettings = availabilityData?.holidaySettings || {...};
  const restTimeSettings = availabilityData?.restTimeSettings || {...};

  return {
    // ... 기타 필드 ...
    availabilitySlots: availabilitySlots,      // ← 이미 포함!
    holidaySettings: holidaySettings,          // ← 이미 포함!
    restTimeSettings: restTimeSettings,        // ← 이미 포함!
  };
}
```

**결론**:
- `ExpertProfileDetail.tsx`가 이미 `/experts/:displayId/profile`을 호출하고 있음
- 이 응답에 `availabilitySlots`, `holidaySettings`, `restTimeSettings`가 모두 포함됨
- **별도로 `/availability` 엔드포인트를 호출할 필요가 없음**

## 해결 방안

### 옵션 1: 프론트엔드 수정 (권장)
`ReservationModalImproved.tsx`에서 별도 API 호출을 제거하고 props로 전달된 expert 데이터 사용

**장점**:
- API 호출 1회 감소 (성능 향상)
- 권한 문제 없음
- 데이터 일관성 보장 (동일한 시점의 데이터)

**단점**:
- Expert 타입 정의에 availability 필드 추가 필요

### 옵션 2: 백엔드 수정 (비권장)
`GET :displayId/availability` 엔드포인트를 public으로 변경

**장점**:
- 프론트엔드 코드 변경 최소화

**단점**:
- 불필요한 API 엔드포인트 추가 유지
- 중복된 데이터 조회로 인한 성능 저하
- 데이터 불일치 가능성 (profile과 availability를 각각 조회)

## 적용할 수정사항

### 1. ReservationModalImproved.tsx 수정
**파일**: `apps/web/src/components/reservation/ReservationModalImproved.tsx`

**제거할 코드** (Line 138-145):
```typescript
// ❌ 제거: 별도 availability API 호출
const { data: availabilityData } = useQuery({
  queryKey: ['expert-availability', expert.displayId],
  queryFn: async () => {
    const response = await api.get(`/experts/${expert.displayId}/availability`);
    return response.data;
  },
  enabled: isOpen
});
```

**추가할 코드**:
```typescript
// ✅ props로 전달된 expert 데이터 사용
const availabilityData = {
  availabilitySlots: expert.availabilitySlots || [],
  holidaySettings: expert.holidaySettings || {
    acceptHolidayConsultations: false,
    holidayNote: ''
  },
  restTimeSettings: expert.restTimeSettings || {
    enableLunchBreak: false,
    lunchStartTime: '12:00',
    lunchEndTime: '13:00',
    enableDinnerBreak: false,
    dinnerStartTime: '18:00',
    dinnerEndTime: '19:00'
  }
};
```

### 2. Expert 타입 정의 확장
**파일**: `apps/web/src/types/expert.ts` (또는 관련 타입 파일)

```typescript
export interface Expert {
  id: number;
  displayId: string;
  name: string;
  // ... 기존 필드들 ...

  // 새로 추가: availability 관련 필드
  availabilitySlots?: Array<{
    id: number;
    expertId: number;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }>;
  holidaySettings?: {
    acceptHolidayConsultations: boolean;
    holidayNote: string;
  };
  restTimeSettings?: {
    enableLunchBreak: boolean;
    lunchStartTime: string;
    lunchEndTime: string;
    enableDinnerBreak: boolean;
    dinnerStartTime: string;
    dinnerEndTime: string;
  };
}
```

### 3. ExpertProfileDetail.tsx 확인
**파일**: `apps/web/src/components/experts/ExpertProfileDetail.tsx`

ReservationModalImproved에 expert prop 전달 시 availability 필드가 포함되는지 확인:
```typescript
<ReservationModalImproved
  isOpen={isReservationOpen}
  onClose={handleReservationClose}
  expert={{
    id: expertData.id,
    name: expertData.name,
    displayId: expertData.displayId,
    // ... 기존 필드들 ...

    // ✅ 추가: availability 필드들 전달
    availabilitySlots: expertData.availabilitySlots,
    holidaySettings: expertData.holidaySettings,
    restTimeSettings: expertData.restTimeSettings,
  }}
  userCredits={creditsData?.data}
/>
```

## 예상 효과

### 성능 개선
- API 호출 1회 감소 (예약 모달 열 때마다)
- 네트워크 요청 시간 절약
- 서버 부하 감소

### 사용자 경험 개선
- ❌ 404 에러 제거
- 더 빠른 모달 로딩
- 데이터 일관성 보장

### 유지보수성 향상
- 데이터 흐름 단순화 (profile API → component)
- 중복 코드 제거
- 권한 관리 명확화 (profile은 public, availability 수정은 본인만)

## 테스트 계획

### 1. 예약 모달 기능 테스트
- [ ] 전문가 상세 페이지에서 예약 버튼 클릭
- [ ] 예약 모달 정상 오픈 확인
- [ ] 브라우저 콘솔에 404 에러 없음 확인
- [ ] 공휴일 설정이 모달에 표시되는지 확인
- [ ] 휴식시간 설정이 적용되는지 확인

### 2. 데이터 정합성 테스트
- [ ] 전문가가 availability 설정 변경
- [ ] 프로필 새로고침
- [ ] 예약 모달에서 변경된 설정 확인

### 3. 네트워크 테스트
- [ ] 브라우저 개발자 도구 Network 탭 확인
- [ ] `/availability` API 호출이 없는지 확인
- [ ] `/profile` API 호출 응답에 availability 데이터 포함 확인

## 관련 파일
- `apps/web/src/components/reservation/ReservationModalImproved.tsx` (수정 필요)
- `apps/web/src/components/experts/ExpertProfileDetail.tsx` (확인 필요)
- `apps/api/src/experts/experts.controller.ts` (참고)
- `apps/api/src/experts/experts.service.ts` (참고)
