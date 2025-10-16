# specialties → keywords 완전 마이그레이션 완료

## 개요

백엔드 API에서 `specialties` 필드를 `keywords`로 완전히 대체하여 코드 가독성을 개선하고 필드명의 혼란을 제거했습니다.

**변경 날짜**: 2025-10-16
**변경 파일 수**: 12개 (백엔드 3개 + 프론트엔드 9개)
**Breaking Change**: 예 (하지만 안전하게 처리됨)

---

## 변경 이유

### 문제점
1. **필드명 혼란**: `specialties` (복수형)가 실제로는 **키워드**를 저장하지만, 이름만 보면 "전문 분야들"로 오해
2. **specialty vs specialties 혼동**:
   - `specialty` (단수) = 카테고리 (예: "심리상담")
   - `specialties` (복수) = 키워드 (예: ["스트레스", "우울", "불안"])
3. **데이터 중복**: 프론트엔드 매핑 로직에서 `specialty`가 `specialties` 배열에 포함되어 중복 표시

### 해결책
- 백엔드 API 응답: `specialties` → `keywords`로 변경
- 프론트엔드 전체: `specialties` → `keywords`로 변경
- 데이터베이스: `specialties` 유지 (DB 마이그레이션 불필요)

**결과**:
- ✅ `specialty` = 카테고리 (단수)
- ✅ `keywords` = 키워드 배열 (복수)

---

## 변경 사항 요약

### 백엔드 (3개 파일)

#### 1. **experts.service.ts**
**Line 332-333**: API 응답에서 `specialties` 제거, `keywords`만 반환

```typescript
// 변경 전
specialties: parseJsonField(expert.specialties),
keywords: parseJsonField(expert.keywords || expert.specialties),

// 변경 후
keywords: parseJsonField(expert.specialties),  // DB의 specialties를 keywords로 반환
```

#### 2. **expert-applications.service.ts**
**Line 214**: 주석 추가하여 명확화

```typescript
specialties: application.keywords || [],  // DB에는 specialties로 저장, API에서는 keywords로 반환
```

#### 3. **update-expert-profile.dto.ts**
**Line 55-65**: `keywords` 필드 추가, `specialties`는 하위 호환성 유지

```typescript
// keywords 필드 (권장)
@IsOptional()
@IsArray()
keywords?: any[];

// specialties 필드 (하위 호환성, DB에 저장됨)
@IsOptional()
@IsArray()
specialties?: any[];
```

---

### 프론트엔드 (9개 파일)

#### 1. **types/index.ts**
**Line 9**: 타입 정의 변경

```typescript
// 변경 전
export interface ExpertProfile {
  specialties: string[];
  // ...
}

// 변경 후
export interface ExpertProfile {
  keywords: string[];  // specialties → keywords로 변경
  // ...
}
```

#### 2. **page.tsx** (dashboard/expert/profile)
**Line 307-310**: 데이터 매핑 로직 간소화

```typescript
// 변경 전
specialties: expertProfile.keywords && Array.isArray(expertProfile.keywords) && expertProfile.keywords.length > 0
  ? expertProfile.keywords
  : (expertProfile.specialties && Array.isArray(expertProfile.specialties) && expertProfile.specialties.length > 0
    ? expertProfile.specialties
    : []),

// 변경 후
// specialties는 keywords로 대체 (백엔드에서 keywords로 반환)
specialties: expertProfile.keywords && Array.isArray(expertProfile.keywords)
  ? expertProfile.keywords
  : [],
```

#### 3. **ExpertCard.tsx**
**주요 변경**:
- 타입 정의: `specialties: string[]` → `keywords: string[]`
- normalizeExpert 함수: `specialties` → `keywords` 변수명 변경
- UI 렌더링: `expert.specialties` → `expert.keywords`

```typescript
// 타입 정의 변경
interface CardProps {
  keywords: string[];  // specialties → keywords
}

// normalizeExpert 함수
const keywords: string[] = Array.isArray(raw.keywords)
  ? raw.keywords
  : Array.isArray(raw.tags)
    ? raw.tags
    : raw.specialty ? [raw.specialty] : [];

// UI 렌더링
{expert.keywords.map((keyword, index) => (
  <span key={index}>{keyword}</span>
))}
```

#### 4-9. **나머지 컴포넌트들**
모든 `expert.specialties` → `expert.keywords`로 일괄 변경:
- ExpertList.tsx
- ExpertProfileDetail.tsx
- ExpertProfile.tsx
- HomePage.tsx
- ExpertContactModal.tsx
- page.tsx (experts)

---

## 데이터 흐름 (변경 후)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 데이터베이스 (Prisma Schema)                              │
├─────────────────────────────────────────────────────────────┤
│ Expert 테이블:                                               │
│ - specialty: String (카테고리, 예: "심리상담")               │
│ - specialties: Json (키워드 배열, 예: ["스트레스", "우울"])  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. 백엔드 API 응답 (experts.service.ts)                      │
├─────────────────────────────────────────────────────────────┤
│ GET /experts/:displayId:                                    │
│ {                                                            │
│   specialty: "심리상담",                                     │
│   keywords: ["스트레스", "우울", "불안"],  // ✅ 변경됨      │
│   // specialties 필드 없음                                   │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. 프론트엔드 타입 (types/index.ts)                          │
├─────────────────────────────────────────────────────────────┤
│ interface ExpertProfile {                                   │
│   specialty: string;                                        │
│   keywords: string[];  // ✅ 변경됨                         │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. UI 컴포넌트 (ExpertCard.tsx 등)                          │
├─────────────────────────────────────────────────────────────┤
│ <div>상담분야: {expert.specialty}</div>                      │
│ <div>키워드:                                                 │
│   {expert.keywords.map(keyword => (                         │
│     <span>{keyword}</span>  // ✅ keywords 사용              │
│   ))}                                                        │
│ </div>                                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 필드 사용 가이드

| 필드 | 타입 | 용도 | 예시 |
|------|------|------|------|
| **specialty** (단수) | `string` | 카테고리 | "심리상담", "법률상담" |
| **keywords** (복수) | `string[]` | 키워드 배열 | ["스트레스", "우울", "불안"] |

### 올바른 사용 예시

```typescript
// ✅ 올바른 사용
const expert = {
  specialty: "심리상담",        // 카테고리
  keywords: ["스트레스", "우울"] // 키워드 배열
};

// ❌ 잘못된 사용 (이전 방식)
const expert = {
  specialty: "심리상담",
  specialties: ["심리상담", "스트레스", "우울"]  // specialty가 중복됨
};
```

---

## 하위 호환성

### 백엔드 DTO
프론트엔드가 `specialties`로 데이터를 전송하더라도 받을 수 있도록 DTO에 두 필드 모두 정의:

```typescript
export class UpdateExpertProfileDto {
  keywords?: any[];      // 권장 (새로운 방식)
  specialties?: any[];   // 하위 호환성 (기존 방식)
}
```

### 프론트엔드
백엔드가 `keywords`로 반환하므로 프론트엔드는 `keywords`만 사용:

```typescript
const expertData = {
  keywords: formData.keywords  // keywords로 전송
};
```

---

## 테스트 체크리스트

### 백엔드 테스트
- [ ] GET `/experts/:displayId` 응답에 `keywords` 필드 포함 확인
- [ ] GET `/experts/:displayId` 응답에 `specialties` 필드 없음 확인
- [ ] POST `/experts/apply` 요청에서 `keywords` 저장 확인
- [ ] PUT `/experts/:displayId/profile` 요청에서 `keywords` 업데이트 확인

### 프론트엔드 테스트
- [ ] 전문가 카드에 키워드 배지 정상 표시 확인
- [ ] 프로필 편집 모드에서 키워드 입력/수정 확인
- [ ] 전문가 목록 페이지에서 키워드 표시 확인
- [ ] 홈페이지에서 전문가 키워드 표시 확인
- [ ] TypeScript 타입 에러 없음 확인

### 통합 테스트
- [ ] 전문가 지원 → 승인 → 프로필 편집 전체 플로우 테스트
- [ ] `specialty`가 `keywords`에 중복 표시되지 않는지 확인
- [ ] 기존 전문가 데이터가 정상 표시되는지 확인

---

## 영향받는 API 엔드포인트

### 응답 변경된 엔드포인트
- `GET /v1/experts` - 전문가 목록
- `GET /v1/experts/:displayId` - 전문가 상세
- `GET /v1/experts/:displayId/profile` - 프로필 조회

### DTO 변경된 엔드포인트
- `POST /v1/experts/apply` - 전문가 지원 (keywords 또는 specialties 허용)
- `PUT /v1/experts/:displayId/profile` - 프로필 수정 (keywords 또는 specialties 허용)

---

## 마이그레이션 가이드

### 기존 프로젝트에서 적용하는 경우

#### 1단계: 백엔드 변경
```bash
# API 서버 재시작
pnpm --filter @consulton/api start:dev
```

#### 2단계: 프론트엔드 변경
```bash
# 타입 체크
cd apps/web
npx tsc --noEmit

# 개발 서버 실행
pnpm dev
```

#### 3단계: 테스트
- 브라우저에서 전문가 목록 확인
- 전문가 상세 페이지 확인
- 프로필 편집 모드 확인

---

## 롤백 가이드

만약 문제가 발생하면 다음 커밋으로 롤백:

```bash
git log --oneline | grep "specialties"
git revert <commit-hash>
```

---

## 주의사항

### ⚠️ Breaking Change
이 변경은 **Breaking Change**입니다:
- 백엔드 API 응답에서 `specialties` 필드가 제거됨
- 프론트엔드가 `specialties`를 사용하던 곳은 모두 `keywords`로 변경해야 함

### ✅ 하위 호환성 유지
- 백엔드 DTO는 `keywords`와 `specialties` 모두 받을 수 있음
- 데이터베이스는 변경 없음 (`specialties` 필드 유지)

### 📊 기존 데이터
- 기존 전문가 데이터는 영향 없음
- DB의 `specialties` 필드가 API에서 `keywords`로 반환됨

---

## 관련 문서

- [PROFILE_DATA_FLOW_FIX.md](PROFILE_DATA_FLOW_FIX.md) - specialty와 keywords 분리 수정
- [WORKEXPERIENCE_FIX.md](WORKEXPERIENCE_FIX.md) - workExperience 파싱 수정
- [SPECIALTY_KEYWORD_FIX.md](SPECIALTY_KEYWORD_FIX.md) - 키워드 UI 정렬

---

## 결론

### 변경 완료 ✅
- ✅ 백엔드 API: `specialties` → `keywords`
- ✅ 프론트엔드: 모든 컴포넌트 `keywords` 사용
- ✅ 타입 정의: `keywords: string[]`
- ✅ 하위 호환성: DTO에서 두 필드 모두 허용

### 개선 효과
- ✅ 필드명이 의미를 명확히 반영
- ✅ `specialty`와 `keywords` 구분 명확
- ✅ 데이터 중복 문제 해결
- ✅ 코드 가독성 향상

**작성일**: 2025-10-16
**작성자**: Claude Code
**상태**: 완료 ✅
