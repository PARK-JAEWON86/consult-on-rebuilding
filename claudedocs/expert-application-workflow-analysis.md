# 전문가 지원 워크플로우 데이터 흐름 분석

## 📋 분석 개요

**목적**: 전문가 지원 데이터가 관리자 페이지에는 표시되지만 전문가 프로필 편집 페이지에는 적용되지 않는 문제 원인 분석

**분석 날짜**: 2025-10-22

**결론**: ❌ 다중 폴백 구조 문제 아님 | ✅ 승인 시 데이터 변환 로직 누락

---

## 🔄 데이터 흐름 맵

```
사용자 지원 제출
    ↓
ExpertApplication 테이블 저장 (모든 필드 포함 ✅)
    ↓
관리자 검토 (모든 필드 표시 ✅)
    ↓
관리자 승인
    ↓
Expert 테이블 생성 ⚠️ 일부 필드 누락
    ↓
전문가 프로필 편집 페이지 (누락된 필드 표시 안됨 ❌)
```

---

## 📊 데이터 소스별 분석

### 1. 전문가 지원하기 페이지
**파일**: `apps/web/src/app/experts/become/page.tsx`

**수집 데이터** (line 763-833):
```typescript
{
  // 기본 정보
  name, email, phoneNumber, specialty, experienceYears, bio,

  // 전문성 정보
  keywords, consultationTypes, languages, mbti, consultationStyle,

  // 경력 및 학력
  education, certifications, workExperience,

  // 스케줄 정보 ✅
  availabilitySlots: [
    { dayOfWeek, startTime, endTime, isActive }
  ],
  holidaySettings: {
    acceptHolidayConsultations,
    holidayNote
  },

  // 소셜 링크 ✅
  socialLinks: {
    website, instagram, youtube, linkedin, blog
  },

  // 포트폴리오
  profileImage, portfolioImages
}
```

**API 엔드포인트**: `POST /experts/apply`

**상태**: ✅ 모든 데이터 올바르게 전송됨

---

### 2. 관리자 전문가 지원 상세 페이지
**파일**: `apps/web/src/app/admin/applications/[id]/page.tsx`

**데이터 소스**: `GET /admin/applications/${id}`

**표시 필드**:
- ✅ availabilitySlots (line 496-585)
- ✅ holidaySettings (line 568-583)
- ✅ socialLinks (line 587-698)
- ✅ mbti, consultationStyle (line 349-370)
- ✅ workExperience (line 426-447)
- ✅ portfolioImages (line 324-347)

**상태**: ✅ ExpertApplication의 모든 데이터 올바르게 표시됨

---

### 3. 전문가 프로필 편집 페이지
**파일**: `apps/web/src/app/dashboard/expert/profile/page.tsx`

**데이터 로드 순서** (line 122-439):
```
1차: user?.expert?.displayId 확인
2차: API GET /experts (목록 조회)
3차: API GET /experts/${displayId} (상세 조회) ⬅️ 주요 데이터 소스
4차: localStorage 폴백
5차: 기본 프로필 생성
```

**데이터 소스**: `GET /experts/${displayId}` → **Expert 테이블**

**상태**: ❌ Expert 테이블에 일부 필드 누락으로 표시 안됨

---

## 🔴 핵심 문제: 승인 시 데이터 변환 로직 누락

**파일**: `apps/api/src/admin/expert-applications/expert-applications.service.ts`

**함수**: `approveApplication` (line 256-499)

### 문제가 있는 코드 (line 338-353)

```typescript
// Expert 엔티티 생성
availability: (() => {
  const availabilityData =
    typeof application.availability === 'object'
      ? application.availability
      : {}

  // ❌ 문제: holidaySettings를 하드코딩된 기본값으로 덮어씀
  return {
    ...availabilityData,
    holidaySettings: {
      acceptHolidayConsultations: false,  // ⚠️ 항상 false
      holidayNote: '',                    // ⚠️ 항상 빈 문자열
    },
  } as any
})(),
```

### 누락된 데이터

1. **availabilitySlots** (슬롯 기반 스케줄)
   - ExpertApplication에 저장됨: `application.availability.availabilitySlots`
   - Expert 생성 시: 명시적으로 추출하지 않음
   - 결과: availability 객체 안에 포함되어야 하는데 누락 가능성

2. **holidaySettings** (공휴일 설정)
   - ExpertApplication에 저장됨: `application.availability.holidaySettings`
   - Expert 생성 시: **하드코딩된 기본값으로 덮어씌움**
   - 결과: 사용자가 설정한 공휴일 정보 **완전 손실**

---

## 🔍 다중 폴백 구조 분석

### 다중 폴백이 존재하는 이유

1. **신뢰성**: API 실패 시 대체 데이터 소스 확보
2. **개발 단계**: 점진적 기능 추가 과정에서 발생
3. **데이터 마이그레이션**: 여러 데이터 소스 통합

### 다중 폴백 구조 자체는 문제가 아님

```typescript
// 안전장치로서의 다중 폴백 - 이것은 좋은 패턴
try {
  // 1차: 가장 신뢰할 수 있는 소스
  data = await api.get(`/experts/${displayId}`)
} catch {
  // 2차: 폴백 소스
  data = localStorage.get(`expertProfile_${id}`)
}
```

### 실제 문제는 데이터 변환 로직

```typescript
// ❌ 나쁜 패턴: 승인 시 데이터 손실
Expert.create({
  availability: {
    ...applicationData.availability,
    holidaySettings: HARDCODED_DEFAULT  // ⚠️ 사용자 데이터 손실
  }
})
```

---

## 📋 수정 계획

### 수정 대상 파일
`apps/api/src/admin/expert-applications/expert-applications.service.ts`

### 수정 위치
`approveApplication` 함수 - Expert 엔티티 생성 부분 (line 338-353)

### 수정 방법

#### 현재 코드
```typescript
availability: (() => {
  const availabilityData =
    typeof application.availability === 'object'
      ? application.availability
      : {}

  return {
    ...availabilityData,
    holidaySettings: {
      acceptHolidayConsultations: false,
      holidayNote: '',
    },
  } as any
})(),
```

#### 수정 후 코드
```typescript
availability: (() => {
  // application.availability 파싱
  const availabilityData =
    typeof application.availability === 'string'
      ? JSON.parse(application.availability)
      : typeof application.availability === 'object'
      ? application.availability
      : {}

  // availabilitySlots 명시적 추출
  const availabilitySlots = availabilityData?.availabilitySlots || []

  // holidaySettings 명시적 추출 (하드코딩된 기본값 제거)
  const holidaySettings = availabilityData?.holidaySettings || {
    acceptHolidayConsultations: false,
    holidayNote: ''
  }

  // 모든 스케줄 정보를 포함한 availability 객체 반환
  return {
    ...availabilityData,
    availabilitySlots,
    holidaySettings,
  } as any
})(),
```

### 수정 효과

1. ✅ **availabilitySlots 보존**: 사용자가 설정한 세부 시간대 유지
2. ✅ **holidaySettings 보존**: 공휴일 상담 가능 여부 및 메모 유지
3. ✅ **데이터 무결성**: ExpertApplication → Expert 변환 시 데이터 손실 없음
4. ✅ **프로필 편집 페이지**: Expert 테이블에서 완전한 데이터 로드 가능

---

## 🎯 검증 방법

### 수정 전 테스트
1. 전문가 지원 제출 (availabilitySlots, holidaySettings 포함)
2. 관리자 페이지에서 데이터 확인 ✅
3. 관리자 승인 처리
4. 전문가 프로필 편집 페이지 확인 ❌ (데이터 누락)

### 수정 후 테스트
1. 전문가 지원 제출 (availabilitySlots, holidaySettings 포함)
2. 관리자 페이지에서 데이터 확인 ✅
3. 관리자 승인 처리
4. 전문가 프로필 편집 페이지 확인 ✅ (모든 데이터 표시)

### 검증 SQL
```sql
-- Expert 테이블에 availability 데이터 확인
SELECT
  id,
  displayId,
  availability->>'availabilitySlots' as slots,
  availability->'holidaySettings'->>'acceptHolidayConsultations' as holiday_enabled,
  availability->'holidaySettings'->>'holidayNote' as holiday_note
FROM experts
WHERE userId = [테스트_사용자_ID];
```

---

## 📌 결론

### 문제 원인
- ❌ 다중 폴백 구조 때문 (X)
- ✅ **승인 시 데이터 변환 로직에서 필드 누락** (O)

### 해결 방법
1. `approveApplication` 함수 수정
2. `availability` 객체 생성 시 `availabilitySlots`와 `holidaySettings` 명시적 추출
3. 하드코딩된 기본값 제거, ExpertApplication 데이터 사용

### 영향 범위
- **수정 파일**: 1개 (expert-applications.service.ts)
- **영향 받는 기능**: 전문가 승인 프로세스, 전문가 프로필 편집
- **하위 호환성**: 기존 Expert 레코드는 영향 없음 (신규 승인부터 적용)

### 추가 권장사항
1. 기존 Expert 레코드 데이터 마이그레이션 고려
2. Expert 엔티티 생성 로직 테스트 케이스 추가
3. ExpertApplication → Expert 필드 매핑 문서화
