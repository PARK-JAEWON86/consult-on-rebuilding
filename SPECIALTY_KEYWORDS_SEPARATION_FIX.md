# 전문분야(Specialty)와 키워드(Keywords) 분리 수정

## 문제 상황

전문가 지원양식에서 전문분야(카테고리)와 키워드를 따로 입력했지만, 전문가 프로필 편집 모드에서 전문분야 필드에 키워드가 함께 표시되는 문제가 발생했습니다.

### 근본 원인

1. **전문가 지원양식** ([become/page.tsx:634-638](apps/web/src/app/experts/become/page.tsx#L634-L638))
   - `specialty` 필드에 카테고리명과 키워드를 합쳐서 전송
   - 예: `"심리상담 - 스트레스, 우울, 불안"` (❌ 잘못됨)

2. **프로필 페이지 타입 불일치** ([page.tsx:45](apps/web/src/app/dashboard/expert/profile/page.tsx#L45))
   - `ExpertProfileData` 타입이 `specialties`를 사용
   - `ExpertProfileEdit` 컴포넌트는 `keywords`를 사용

3. **백엔드 업데이트 로직** ([experts.service.ts:1195-1196](apps/api/src/experts/experts.service.ts#L1195-L1196))
   - `keywords` 필드 처리 누락

## 수정 내용

### 1. 전문가 지원양식 수정

**파일**: `apps/web/src/app/experts/become/page.tsx`

**변경 전**:
```typescript
// 키워드를 specialty에 포함 (키워드가 있는 경우)
const keywordsText = keywords.length > 0 ? keywords.join(', ') : ''
const fullSpecialty = keywordsText
  ? `${categoryName} - ${keywordsText}`  // ❌ 문제
  : categoryName || specialty
```

**변경 후**:
```typescript
// specialty는 카테고리명만 (키워드는 별도로 keywords 필드에 전송)
const fullSpecialty = categoryName || specialty  // ✅ 카테고리명만
```

### 2. 프로필 페이지 타입 수정

**파일**: `apps/web/src/app/dashboard/expert/profile/page.tsx`

**변경 전**:
```typescript
type ExpertProfileData = {
  // ...
  specialties: string[];  // ❌ 잘못된 필드명
  // ...
};
```

**변경 후**:
```typescript
type ExpertProfileData = {
  // ...
  keywords: string[];  // ✅ 올바른 필드명
  // ...
};
```

### 3. 데이터 매핑 수정

**파일**: `apps/web/src/app/dashboard/expert/profile/page.tsx`

**변경 전**:
```typescript
// specialties는 keywords로 대체 (백엔드에서 keywords로 반환)
specialties: expertProfile.keywords && Array.isArray(expertProfile.keywords)
  ? expertProfile.keywords
  : [],
```

**변경 후**:
```typescript
// keywords 필드 (백엔드에서 keywords로 반환)
keywords: expertProfile.keywords && Array.isArray(expertProfile.keywords)
  ? expertProfile.keywords
  : [],
```

### 4. localStorage 저장 로직 수정

**파일**: `apps/web/src/app/dashboard/expert/profile/page.tsx`

**변경 전**:
```typescript
const storageData = {
  // ...
  keywords: updated.specialties,  // ❌ 잘못된 필드 참조
  specialties: updated.specialties,
  // ...
};
```

**변경 후**:
```typescript
const storageData = {
  // ...
  keywords: updated.keywords,  // ✅ 올바른 필드 참조
  // ...
};
```

### 5. 백엔드 업데이트 로직 수정

**파일**: `apps/api/src/experts/experts.service.ts`

**변경 전**:
```typescript
// JSON 배열 필드들
if (updateDto.specialties !== undefined) {
  updateData.specialties = updateDto.specialties;  // keywords 처리 누락
}
```

**변경 후**:
```typescript
// keywords와 specialties 모두 처리 (DB에는 specialties로 저장)
if (updateDto.keywords !== undefined) {
  updateData.specialties = updateDto.keywords;
} else if (updateDto.specialties !== undefined) {
  updateData.specialties = updateDto.specialties;
}
```

### 6. 프로필 완성도 체크 수정

**파일**: `apps/api/src/experts/experts.service.ts`

**변경 전**:
```typescript
const updatedSpecialties = updateDto.specialties ?? currentExpert.specialties;
```

**변경 후**:
```typescript
// keywords와 specialties 모두 처리
const updatedSpecialties = updateDto.keywords ?? updateDto.specialties ?? currentExpert.specialties;
```

## 데이터 흐름

### 수정 후 올바른 데이터 흐름:

```
전문가 지원양식
  ├─ specialty: "심리상담" (카테고리명만)
  └─ keywords: ["스트레스", "우울", "불안"] (키워드 배열)
         ↓
백엔드 저장 (DB)
  ├─ specialty: "심리상담"
  └─ specialties (JSON): ["스트레스", "우울", "불안"]
         ↓
백엔드 API 응답
  ├─ specialty: "심리상담"
  └─ keywords: ["스트레스", "우울", "불안"]
         ↓
프론트엔드 (프로필 편집)
  ├─ specialty: "심리상담" (읽기 전용)
  └─ keywords: ["스트레스", "우울", "불안"] (편집 가능)
```

## 필드 정의

- **`specialty`** (단수, string): 전문 분야 카테고리 (예: "심리상담", "법률상담")
  - 승인 후 변경 불가능
  - 읽기 전용

- **`keywords`** (복수, string[]): 상담 주제 키워드 배열 (예: ["스트레스", "우울", "불안"])
  - 프로필 편집에서 수정 가능
  - 최소 1개 이상 필요

## 영향 받는 파일 목록

### 프론트엔드 (2개 파일)
1. `apps/web/src/app/experts/become/page.tsx` - 전문가 지원양식
2. `apps/web/src/app/dashboard/expert/profile/page.tsx` - 프로필 페이지

### 백엔드 (1개 파일)
1. `apps/api/src/experts/experts.service.ts` - 전문가 서비스

## 테스트 권장 사항

### 1. 전문가 지원 플로우
- [ ] 전문가 지원 양식에서 카테고리 선택
- [ ] 키워드 입력 (예: "스트레스, 우울, 불안")
- [ ] 지원서 제출
- [ ] 관리자 승인

### 2. 프로필 편집 확인
- [ ] 프로필 편집 모드 진입
- [ ] 전문분야 필드: 카테고리명만 표시 (읽기 전용)
- [ ] 키워드 필드: 키워드 배열만 표시 (편집 가능)
- [ ] 키워드 수정 및 저장

### 3. 데이터 일관성 확인
- [ ] 프로필 저장 후 새로고침해도 데이터 유지
- [ ] 전문가 목록 페이지에서 키워드 정상 표시
- [ ] 전문가 상세 페이지에서 키워드 정상 표시

## API 서버 상태

✅ **정상 실행 중** (http://localhost:4000)
- 모든 라우트 정상 등록
- Hot-reload 활성화
- 0 TypeScript 에러

## 관련 문서

- [SPECIALTIES_TO_KEYWORDS_MIGRATION.md](SPECIALTIES_TO_KEYWORDS_MIGRATION.md) - 전체 마이그레이션 가이드
- [PROFILE_DATA_FLOW_FIX.md](PROFILE_DATA_FLOW_FIX.md) - 초기 데이터 흐름 수정
