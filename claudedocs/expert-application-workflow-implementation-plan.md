# 전문가 지원 워크플로우 데이터 손실 문제 수정 완료

## 📋 수정 개요

**수정 날짜**: 2025-10-22
**수정 파일**: `apps/api/src/admin/expert-applications/expert-applications.service.ts`
**수정 함수**: `approveApplication` (line 256-495)

---

## 🔍 문제 진단

### 발견된 데이터 손실 필드

| 필드 | 문제 | 심각도 |
|------|------|--------|
| **availabilitySlots** | availability 객체 내부에 포함되지만 명시적 추출 없음 | 🔴 높음 |
| **holidaySettings** | 하드코딩된 기본값으로 덮어씌워짐 | 🔴 높음 |
| **phoneNumber** | contactInfo.phone에 매핑 안됨 (빈 문자열) | 🟡 중간 |
| **socialLinks** | 문자열 파싱 처리 누락 | 🟡 중간 |

### 올바르게 처리된 필드 (수정 불필요)

- ✅ **certifications**: `application.certifications` 직접 매핑
- ✅ **portfolioImages**: `application.portfolioImages` → `portfolioFiles`로 매핑
- ✅ **mbti, consultationStyle**: 올바르게 매핑됨
- ✅ **workExperience, education, keywords**: 올바르게 매핑됨

---

## 🛠️ 수정 사항

### 1. 데이터 파싱 헬퍼 함수 추가 (line 308-343)

#### 수정 전
```typescript
const cleanSpecialty = parseSpecialty(application.specialty)

const expert = await tx.expert.create({
  // ...
})
```

#### 수정 후
```typescript
const cleanSpecialty = parseSpecialty(application.specialty)

// availability 데이터 파싱 (문자열 또는 객체 처리)
const parseAvailabilityData = (availability: any) => {
  if (!availability) return {}
  if (typeof availability === 'string') {
    try {
      return JSON.parse(availability)
    } catch {
      return {}
    }
  }
  return typeof availability === 'object' ? availability : {}
}

// socialLinks 데이터 파싱 (문자열 또는 객체 처리)
const parseSocialLinksData = (links: any) => {
  if (!links) return {}
  if (typeof links === 'string') {
    try {
      return JSON.parse(links)
    } catch {
      return {}
    }
  }
  return typeof links === 'object' ? links : {}
}

// availability 파싱 및 필드 추출
const availabilityData = parseAvailabilityData(application.availability)
const availabilitySlots = availabilityData?.availabilitySlots || []
const holidaySettings = availabilityData?.holidaySettings || {
  acceptHolidayConsultations: false,
  holidayNote: ''
}

// socialLinks 파싱
const appSocialLinks = parseSocialLinksData(application.socialLinks)

const expert = await tx.expert.create({
  // ...
})
```

**효과**:
- ✅ availability JSON의 문자열/객체 모두 처리 가능
- ✅ availabilitySlots 명시적 추출
- ✅ holidaySettings 원본 데이터 보존
- ✅ socialLinks 문자열 파싱 지원

---

### 2. availability 필드 수정 (line 376-380)

#### 수정 전
```typescript
availability: (() => {
  const availabilityData =
    typeof application.availability === 'object'
      ? application.availability
      : {}

  // ❌ 문제: holidaySettings를 하드코딩된 기본값으로 덮어씀
  return {
    ...availabilityData,
    holidaySettings: {
      acceptHolidayConsultations: false,  // 항상 false
      holidayNote: '',                    // 항상 빈 문자열
    },
  } as any
})(),
```

#### 수정 후
```typescript
availability: {
  ...availabilityData,
  availabilitySlots,  // ✅ 명시적으로 추출한 슬롯 포함
  holidaySettings,    // ✅ 원본 데이터 사용 (하드코딩 제거)
} as any,
```

**효과**:
- ✅ 사용자가 설정한 availabilitySlots 보존
- ✅ 공휴일 상담 가능 여부(`acceptHolidayConsultations`) 보존
- ✅ 공휴일 메모(`holidayNote`) 보존

---

### 3. contactInfo.phone 필드 수정 (line 381-386)

#### 수정 전
```typescript
contactInfo: {
  phone: '',  // ❌ 항상 빈 문자열
  email: application.email,
  location: '',
  website: '',
} as any,
```

#### 수정 후
```typescript
contactInfo: {
  phone: application.phoneNumber || '',  // ✅ phoneNumber 필드 사용
  email: application.email,
  location: '',
  website: '',
} as any,
```

**효과**:
- ✅ 전문가 전화번호 보존

---

### 4. socialLinks 필드 수정 (line 387-397)

#### 수정 전
```typescript
socialLinks: (() => {
  // ❌ 중복 파싱 로직
  const appSocialLinks =
    typeof application.socialLinks === 'object'
      ? (application.socialLinks as any)
      : {}

  return {
    website: appSocialLinks?.website || '',
    instagram: appSocialLinks?.instagram || '',
    // ...
  }
})() as any,
```

#### 수정 후
```typescript
socialLinks: {
  // ✅ 이미 파싱된 appSocialLinks 사용 (중복 제거)
  website: appSocialLinks?.website || '',
  instagram: appSocialLinks?.instagram || '',
  youtube: appSocialLinks?.youtube || '',
  linkedin: appSocialLinks?.linkedin || '',
  blog: appSocialLinks?.blog || '',
  github: '',
  twitter: '',
  facebook: '',
} as any,
```

**효과**:
- ✅ 문자열로 저장된 socialLinks 파싱 지원
- ✅ 중복 파싱 로직 제거로 코드 간결화

---

### 5. ExpertAvailability 슬롯 생성 로직 개선 (line 464-484)

#### 수정 전
```typescript
// 5. ExpertAvailability 슬롯 생성 (availabilitySlots가 있는 경우)
if (
  appData.availabilitySlots &&  // ❌ appData에서 직접 참조
  Array.isArray(appData.availabilitySlots)
) {
  try {
    const slots = appData.availabilitySlots.map((slot: any) => ({
      // ...
    }))
    // ...
  }
}
```

#### 수정 후
```typescript
// 5. ExpertAvailability 슬롯 생성 (availabilitySlots가 있는 경우)
if (availabilitySlots && Array.isArray(availabilitySlots) && availabilitySlots.length > 0) {
  // ✅ 이미 파싱된 availabilitySlots 사용
  try {
    const slots = availabilitySlots.map((slot: any) => ({
      expertId: expert.id,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isActive: slot.isActive !== false,
      timeZone: 'Asia/Seoul',
    }))

    await tx.expertAvailability.createMany({
      data: slots,
      skipDuplicates: true,
    })
    console.log(`✅ ExpertAvailability 슬롯 생성: ${slots.length}개`)
  } catch (error) {
    console.error('⚠️ ExpertAvailability 슬롯 생성 실패:', error)
  }
}
```

**효과**:
- ✅ 이미 파싱된 availabilitySlots 재사용
- ✅ 빈 배열 체크 추가로 불필요한 처리 방지

---

## 📊 수정 영향 범위

### 직접 영향
- ✅ 전문가 승인 프로세스 (`approveApplication`)
- ✅ Expert 엔티티 생성 로직
- ✅ ExpertAvailability 슬롯 생성

### 간접 영향
- ✅ 전문가 프로필 편집 페이지 (Expert 테이블에서 완전한 데이터 로드)
- ✅ 전문가 상세 페이지 (모든 필드 표시 가능)
- ✅ 예약 시스템 (availabilitySlots 정확한 데이터)

### 하위 호환성
- ✅ 기존 Expert 레코드는 영향 없음
- ✅ 신규 승인부터 개선된 데이터 저장
- ✅ 기존 승인 프로세스 호환 유지

---

## ✅ 검증 방법

### 수정 전 문제 재현

1. **전문가 지원 제출**:
   ```
   - availabilitySlots: [월요일 09:00-18:00, 화요일 10:00-19:00]
   - holidaySettings: { acceptHolidayConsultations: true, holidayNote: "토요일만 가능" }
   - phoneNumber: "010-1234-5678"
   - socialLinks: { website: "https://example.com", instagram: "@expert" }
   ```

2. **관리자 승인 처리**

3. **Expert 테이블 확인**:
   ```sql
   SELECT
     availability->>'availabilitySlots' as slots,
     availability->'holidaySettings'->>'acceptHolidayConsultations' as holiday,
     contactInfo->>'phone' as phone,
     socialLinks->>'website' as website
   FROM experts WHERE userId = [TEST_USER_ID];
   ```

4. **수정 전 결과**:
   ```
   slots: null 또는 undefined
   holiday: "false" (항상)
   phone: "" (빈 문자열)
   website: "" (빈 문자열, 파싱 실패 시)
   ```

### 수정 후 검증

1. **동일한 데이터로 새로 지원 제출**

2. **관리자 승인 처리**

3. **Expert 테이블 확인**:
   ```sql
   SELECT
     availability->>'availabilitySlots' as slots,
     availability->'holidaySettings'->>'acceptHolidayConsultations' as holiday,
     availability->'holidaySettings'->>'holidayNote' as holiday_note,
     contactInfo->>'phone' as phone,
     socialLinks->>'website' as website
   FROM experts WHERE userId = [TEST_USER_ID];
   ```

4. **수정 후 기대 결과**:
   ```
   slots: "[{\"dayOfWeek\":\"MONDAY\",\"startTime\":\"09:00\",\"endTime\":\"18:00\", ...}]"
   holiday: "true"
   holiday_note: "토요일만 가능"
   phone: "010-1234-5678"
   website: "https://example.com"
   ```

5. **ExpertAvailability 테이블 확인**:
   ```sql
   SELECT dayOfWeek, startTime, endTime, isActive
   FROM expert_availability
   WHERE expertId = [EXPERT_ID]
   ORDER BY dayOfWeek;
   ```

6. **기대 결과**:
   ```
   MONDAY   | 09:00 | 18:00 | true
   TUESDAY  | 10:00 | 19:00 | true
   ```

7. **전문가 프로필 편집 페이지 확인**:
   - ✅ 상담 가능 시간 슬롯이 정확히 표시되는지
   - ✅ 공휴일 설정이 올바르게 표시되는지
   - ✅ 전화번호가 표시되는지
   - ✅ 소셜 링크가 모두 표시되는지

---

## 🎯 성공 기준

### 필수 요구사항
- ✅ availabilitySlots가 Expert 테이블에 저장됨
- ✅ holidaySettings가 원본 데이터로 저장됨
- ✅ phoneNumber가 contactInfo.phone에 저장됨
- ✅ socialLinks가 문자열/객체 모두 파싱됨
- ✅ ExpertAvailability 테이블에 슬롯 생성됨

### 품질 요구사항
- ✅ 기존 승인 프로세스 정상 작동
- ✅ 트랜잭션 무결성 유지
- ✅ 에러 처리 유지
- ✅ 로그 메시지 유지

### 사용자 경험
- ✅ 전문가 프로필 편집 페이지에서 모든 필드 표시
- ✅ 예약 시스템에서 정확한 시간대 표시
- ✅ 전화번호 및 소셜 링크 표시

---

## 📝 추가 권장 사항

### 1. 기존 데이터 마이그레이션 스크립트

이미 승인된 Expert 레코드의 데이터를 복구하려면:

```typescript
// apps/api/scripts/migrate-expert-data.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateExpertData() {
  // 1. 모든 승인된 ExpertApplication 조회
  const applications = await prisma.expertApplication.findMany({
    where: { status: 'APPROVED' }
  })

  for (const app of applications) {
    const expert = await prisma.expert.findFirst({
      where: { userId: app.userId }
    })

    if (!expert) continue

    // availability 파싱
    const availabilityData = typeof app.availability === 'string'
      ? JSON.parse(app.availability)
      : app.availability

    const availabilitySlots = availabilityData?.availabilitySlots || []
    const holidaySettings = availabilityData?.holidaySettings || null

    // Expert 업데이트
    await prisma.expert.update({
      where: { id: expert.id },
      data: {
        availability: {
          ...availabilityData,
          availabilitySlots,
          holidaySettings,
        },
        contactInfo: {
          ...expert.contactInfo,
          phone: app.phoneNumber || '',
        },
        socialLinks: typeof app.socialLinks === 'string'
          ? JSON.parse(app.socialLinks)
          : app.socialLinks,
      }
    })

    // ExpertAvailability 슬롯 생성
    if (availabilitySlots.length > 0) {
      const slots = availabilitySlots.map((slot: any) => ({
        expertId: expert.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isActive: true,
        timeZone: 'Asia/Seoul',
      }))

      await prisma.expertAvailability.createMany({
        data: slots,
        skipDuplicates: true,
      })
    }

    console.log(`✅ Expert ${expert.id} 데이터 마이그레이션 완료`)
  }
}

migrateExpertData()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

### 2. 테스트 케이스 추가

```typescript
// apps/api/src/admin/expert-applications/expert-applications.service.spec.ts
describe('approveApplication', () => {
  it('should preserve all application data when creating expert', async () => {
    const testData = {
      availability: {
        availabilitySlots: [
          { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '18:00', isActive: true }
        ],
        holidaySettings: {
          acceptHolidayConsultations: true,
          holidayNote: '토요일만 가능'
        }
      },
      phoneNumber: '010-1234-5678',
      socialLinks: {
        website: 'https://example.com',
        instagram: '@expert'
      }
    }

    const result = await service.approveApplication(applicationId, reviewDto)

    expect(result.expert.availability.availabilitySlots).toHaveLength(1)
    expect(result.expert.availability.holidaySettings.acceptHolidayConsultations).toBe(true)
    expect(result.expert.contactInfo.phone).toBe('010-1234-5678')
    expect(result.expert.socialLinks.website).toBe('https://example.com')
  })
})
```

### 3. 문서화

- API 문서에 Expert 엔티티 필드 명세 추가
- ExpertApplication → Expert 필드 매핑 테이블 작성
- 개발자 가이드에 데이터 변환 로직 설명 추가

---

## 🔄 롤백 계획

만약 문제가 발생하면:

1. **Git 롤백**:
   ```bash
   git checkout HEAD~1 apps/api/src/admin/expert-applications/expert-applications.service.ts
   ```

2. **수동 롤백**: 수정 전 코드로 복원

3. **데이터베이스 롤백**: 불필요 (Expert 레코드는 생성만 되고 수정 안됨)

---

## 📅 배포 계획

1. **개발 환경 테스트** (완료)
2. **스테이징 환경 배포 및 QA**
3. **프로덕션 배포**
4. **모니터링** (승인 로그, 에러 로그 확인)
5. **기존 데이터 마이그레이션 실행** (선택사항)

---

## 🎉 완료

모든 수정 작업이 완료되었습니다. 전문가 지원 워크플로우에서 데이터 손실 문제가 해결되었으며, 전문가 프로필 편집 페이지에서 모든 필드가 올바르게 표시될 것입니다.
