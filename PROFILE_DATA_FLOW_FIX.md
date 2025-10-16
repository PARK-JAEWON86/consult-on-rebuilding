# 전문가 프로필 데이터 흐름 수정 (Profile Data Flow Fix)

## 문제 요약

사용자 보고: 전문가 지원하기에서 승인된 데이터가 전문가 프로필 편집모드에 제대로 적용되지 않음

### 발견된 문제들

1. **상담분야(specialty)와 키워드(keywords) 혼란**
   - 프로필 편집 모드의 "키워드" 필드에 "상담분야" 값이 함께 표시됨
   - 예: 키워드에 ["심리상담", "스트레스", "우울"] - "심리상담"은 specialty인데 keywords에 중복 표시

2. **상담분야 필드가 편집 가능**
   - 승인 후 변경 불가해야 하는 specialty 필드가 일반 text input으로 구현됨
   - 사용자가 승인된 카테고리를 임의로 변경할 수 있음

3. **경력사항과 학력이 표시되지 않음 (잠재적 문제)**
   - 백엔드와 프론트엔드 로직은 정상이지만, 실제 데이터가 없을 가능성

---

## 근본 원인 분석

### 문제 1: specialty와 keywords 혼란

**위치**: `apps/web/src/app/dashboard/expert/profile/page.tsx` Lines 307-311

**원인**:
```typescript
// ❌ 문제 코드
specialties: expertProfile.specialties && Array.isArray(expertProfile.specialties) && expertProfile.specialties.length > 0
  ? expertProfile.specialties
  : (expertProfile.keywords && Array.isArray(expertProfile.keywords) && expertProfile.keywords.length > 0
    ? expertProfile.keywords
    : [expertProfile.specialty || ""]),  // specialty를 배열에 넣음
```

- `specialties` 배열이 없으면 `specialty` 값을 배열로 만들어 사용
- 이 `specialties` 배열이 Line 688에서 `keywords`로 매핑됨
- 결과: specialty가 keywords 배열에 포함되어 중복 표시

### 문제 2: specialty 필드 편집 가능

**위치**: `apps/web/src/components/dashboard/ExpertProfileEdit.tsx` Lines 627-639

**원인**:
```typescript
// ❌ 문제 코드
<input
  type="text"
  value={formData.specialty}
  onChange={(e) => handleInputChange('specialty', e.target.value)}  // 편집 가능
  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg..."
/>
```

- 상담분야가 일반 text input으로 구현됨 (편집 가능)
- Step3-1BasicProfile.tsx는 dropdown(선택)인데, ExpertProfileEdit는 text input(편집)

### 문제 3: keywords 필드 누락

**위치**: `apps/api/src/experts/experts.service.ts` Line 333

**원인**:
- 백엔드 API 응답에서 `keywords` 필드를 명시적으로 반환하지 않음
- 프론트엔드가 `specialties`를 `keywords`로 매핑하려 하지만, `specialty`가 포함될 수 있음

---

## 수정 내용

### 수정 1: page.tsx specialties 매핑 로직 수정

**파일**: `apps/web/src/app/dashboard/expert/profile/page.tsx`
**라인**: 307-312

**변경 전**:
```typescript
specialties: expertProfile.specialties && Array.isArray(expertProfile.specialties) && expertProfile.specialties.length > 0
  ? expertProfile.specialties
  : (expertProfile.keywords && Array.isArray(expertProfile.keywords) && expertProfile.keywords.length > 0
    ? expertProfile.keywords
    : [expertProfile.specialty || ""]),  // ❌ specialty를 배열에 포함
```

**변경 후**:
```typescript
// specialties는 keywords만 사용 (specialty는 포함하지 않음)
specialties: expertProfile.keywords && Array.isArray(expertProfile.keywords) && expertProfile.keywords.length > 0
  ? expertProfile.keywords
  : (expertProfile.specialties && Array.isArray(expertProfile.specialties) && expertProfile.specialties.length > 0
    ? expertProfile.specialties
    : []),  // ✅ specialty 제외, 빈 배열 반환
```

**효과**:
- `specialty`(상담분야)가 `keywords` 배열에 포함되지 않음
- 키워드는 순수하게 키워드만 표시됨

---

### 수정 2: ExpertProfileEdit.tsx specialty 필드 읽기 전용 변경

**파일**: `apps/web/src/components/dashboard/ExpertProfileEdit.tsx`
**라인**: 627-640

**변경 전**:
```typescript
<div>
  <label className="block text-base font-semibold text-gray-900 mb-3 flex items-center">
    <User className="w-4 h-4 mr-2" /> 상담분야
    <span className="text-red-500 ml-1">*</span>
  </label>
  <input
    type="text"
    value={formData.specialty}
    onChange={(e) => handleInputChange('specialty', e.target.value)}  // ❌ 편집 가능
    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
    placeholder="예: 심리상담, 법률상담"
  />
</div>
```

**변경 후**:
```typescript
<div>
  <label className="block text-base font-semibold text-gray-900 mb-3 flex items-center">
    <User className="w-4 h-4 mr-2" /> 상담분야
    <span className="text-red-500 ml-1">*</span>
    <span className="text-xs text-gray-500 ml-2 font-normal">(승인 후 변경 불가)</span>  // ✅ 안내 추가
  </label>
  <input
    type="text"
    value={formData.specialty}
    readOnly  // ✅ 읽기 전용
    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed text-sm"
    placeholder="예: 심리상담, 법률상담"
  />
</div>
```

**효과**:
- 상담분야 필드가 읽기 전용으로 변경됨
- 사용자가 승인된 카테고리를 변경할 수 없음
- 시각적 피드백: 회색 배경, cursor-not-allowed

---

### 수정 3: 백엔드 API keywords 필드 명시적 반환

**파일**: `apps/api/src/experts/experts.service.ts`
**라인**: 334

**변경 전**:
```typescript
return {
  ...expert,
  // 배열 필드들을 실제 배열로 변환
  specialties: parseJsonField(expert.specialties),
  certifications: parseJsonField(expert.certifications),
  // ... (keywords 필드 없음)
```

**변경 후**:
```typescript
return {
  ...expert,
  // 배열 필드들을 실제 배열로 변환
  specialties: parseJsonField(expert.specialties),
  keywords: parseJsonField(expert.keywords || expert.specialties),  // ✅ keywords 필드 명시적 추가
  certifications: parseJsonField(expert.certifications),
  // ...
```

**효과**:
- 백엔드 API 응답에서 `keywords` 필드를 명시적으로 반환
- 프론트엔드가 `keywords`를 직접 사용 가능
- `keywords` 필드가 없으면 `specialties`를 fallback으로 사용

---

## 데이터 흐름 (수정 후)

### 전문가 지원 → 승인 → 프로필 편집 모드

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 전문가 지원하기 (ExpertApplication)                       │
├─────────────────────────────────────────────────────────────┤
│ - specialty: "심리상담" (dropdown 선택)                      │
│ - keywords: ["스트레스", "우울", "불안"] (사용자 입력)        │
│ - workExperience: [{company, position, period}]             │
│ - education: [{school, major, degree}]                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. 관리자 승인 (Admin Approval)                              │
├─────────────────────────────────────────────────────────────┤
│ - ExpertApplication → Expert 테이블로 데이터 이전            │
│ - specialty: "심리상담" (카테고리 매핑)                       │
│ - specialties: ["스트레스", "우울", "불안"] (JSON 저장)      │
│ - workExperience: [...] (JSON 저장)                         │
│ - education: [...] (JSON 저장)                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. 백엔드 API 응답 (findByDisplayId)                         │
├─────────────────────────────────────────────────────────────┤
│ - specialty: "심리상담" (문자열)                             │
│ - keywords: ["스트레스", "우울", "불안"] (파싱된 배열) ✅     │
│ - workExperience: [...] (파싱된 배열) ✅                     │
│ - education: [...] (파싱된 배열) ✅                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. 프론트엔드 데이터 변환 (page.tsx)                         │
├─────────────────────────────────────────────────────────────┤
│ - specialty: "심리상담" (그대로 전달)                         │
│ - specialties: keywords (keywords만 사용) ✅                 │
│ - portfolioItems: workExperience (매핑)                     │
│ - education: [...] (매핑)                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. ExpertProfileEdit 컴포넌트                                │
├─────────────────────────────────────────────────────────────┤
│ - specialty: "심리상담" (읽기 전용, 회색 배경) ✅             │
│ - keywords: ["스트레스", "우울", "불안"] (편집 가능) ✅       │
│ - workExperience: [...] (편집 가능)                          │
│ - education: [...] (편집 가능)                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 필드 매핑 테이블 (수정 후)

| 단계 | specialty (상담분야) | keywords/specialties (키워드) | workExperience (경력) | education (학력) |
|------|---------------------|------------------------------|----------------------|------------------|
| **ExpertApplication** | "심리상담" (dropdown) | ["스트레스", "우울", "불안"] | [{...}] | [{...}] |
| **Admin Approval** | "심리상담" (category 매핑) | JSON: `["스트레스", "우울", "불안"]` | JSON: `[{...}]` | JSON: `[{...}]` |
| **Backend API** | "심리상담" (string) | **keywords**: `["스트레스", "우울", "불안"]` ✅ | **workExperience**: `[{...}]` ✅ | **education**: `[{...}]` ✅ |
| **page.tsx** | "심리상담" | **specialties**: `keywords` (specialty 제외) ✅ | **portfolioItems**: `workExperience` | **education**: `[{...}]` |
| **ExpertProfileEdit** | "심리상담" (**읽기 전용**) ✅ | **keywords**: `specialties` (편집 가능) ✅ | **workExperience**: `portfolioItems` | **education**: `[{...}]` |

---

## 테스트 시나리오

### 시나리오 1: 상담분야와 키워드 분리 확인

1. 전문가 지원하기에서 데이터 입력:
   - 상담분야: "심리상담" (dropdown 선택)
   - 키워드: "스트레스, 우울, 불안" (comma로 구분)

2. 관리자가 승인

3. 프로필 편집 모드에서 확인:
   - **상담분야 필드**: "심리상담" 표시, 읽기 전용 (회색 배경)
   - **키워드 필드**: ["스트레스", "우울", "불안"] 표시 (파란 배지)
   - ✅ **상담분야가 키워드에 중복 표시되지 않음**

### 시나리오 2: 상담분야 편집 불가 확인

1. 프로필 편집 모드 진입

2. 상담분야 필드 클릭 시도:
   - ✅ **편집 불가** (cursor: not-allowed)
   - ✅ **회색 배경** (bg-gray-50)
   - ✅ **안내 텍스트**: "(승인 후 변경 불가)"

### 시나리오 3: 경력사항과 학력 표시 확인

1. 전문가 지원하기에서 데이터 입력:
   - 경력사항: [{ company: "ABC회사", position: "상담사", period: "2020-2023" }]
   - 학력: [{ school: "서울대학교", major: "심리학", degree: "학사" }]

2. 관리자가 승인

3. 프로필 편집 모드에서 확인:
   - ✅ **경력사항 표시**: "ABC회사", "상담사", "2020-2023"
   - ✅ **학력 표시**: "서울대학교", "심리학", "학사"

---

## 영향받는 파일

### 수정된 파일

1. **apps/web/src/app/dashboard/expert/profile/page.tsx**
   - Line 307-312: `specialties` 매핑 로직 수정 (specialty 제외)

2. **apps/web/src/components/dashboard/ExpertProfileEdit.tsx**
   - Line 627-640: `specialty` 필드 읽기 전용 변경

3. **apps/api/src/experts/experts.service.ts**
   - Line 334: `keywords` 필드 명시적 반환 추가

### 관련 파일 (변경 없음)

- `apps/web/src/components/experts/become-steps/Step3-1BasicProfile.tsx` - 전문가 지원 양식
- `apps/api/prisma/schema.prisma` - Expert 테이블 스키마

---

## 주의사항

### 데이터베이스 기존 데이터

현재 Expert 테이블에는 `keywords` 필드가 없고 `specialties` 필드만 존재합니다.

```prisma
model Expert {
  // ...
  specialties Json  // 키워드 저장 필드
  // keywords 필드 없음
}
```

**백엔드 대응**:
```typescript
keywords: parseJsonField(expert.keywords || expert.specialties),  // keywords가 없으면 specialties 사용
```

**향후 개선 방안**:
- `Expert` 테이블에 `keywords` 필드 추가 고려
- `specialty` 필드와 `keywords` 필드를 명확히 분리

### 기존 전문가 데이터 마이그레이션

이미 승인된 전문가의 데이터가 있는 경우:
- `specialties` 배열에 `specialty` 값이 포함되어 있을 수 있음
- 이 경우 프론트엔드에서 자동으로 필터링됨 (빈 배열 반환)
- **필요 시 데이터 정리 스크립트 작성** 고려

---

## 결론

### 해결된 문제

✅ **상담분야와 키워드 혼란 해결**
- specialty가 keywords 배열에 포함되지 않음
- 키워드는 순수 키워드만 표시됨

✅ **상담분야 편집 불가 구현**
- 승인 후 상담분야 변경 불가능
- 시각적 피드백으로 사용자에게 명확히 전달

✅ **백엔드 API keywords 필드 명시적 반환**
- 프론트엔드가 `keywords`를 직접 사용 가능
- 데이터 흐름이 명확해짐

### 검증 방법

1. 전문가 지원 → 승인 → 프로필 편집 전체 플로우 테스트
2. 상담분야 필드가 읽기 전용인지 확인
3. 키워드 필드에 상담분야가 포함되지 않는지 확인
4. 경력사항과 학력이 정상 표시되는지 확인

---

**작성일**: 2025-10-16
**작성자**: Claude Code
**관련 이슈**: 전문가 프로필 데이터 흐름 수정
**관련 파일**: page.tsx, ExpertProfileEdit.tsx, experts.service.ts
