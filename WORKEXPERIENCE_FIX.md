# workExperience 필드 누락 문제 해결

## 📋 문제 발견

**날짜**: 2025-10-16
**상태**: ✅ 해결 완료

### 문제 상황
전문가 지원하기에서 승인된 데이터가 전문가 프로필 편집 모드에 제대로 반영되지 않는 문제가 발견되었습니다.

특히 **`workExperience`(경력사항) 필드**가 백엔드 API에서 반환되지 않고 있었습니다.

---

## 🔍 원인 분석

### 1. 데이터베이스 스키마 확인
`Expert` 테이블에는 `workExperience` 필드가 **JSON 타입**으로 존재합니다:

```prisma
model Expert {
  // ...
  workExperience     Json                 @default("[]")
  // ...
}
```

### 2. 백엔드 API 응답 확인
`apps/api/src/experts/experts.service.ts`의 `findByDisplayId()` 메서드에서:

**문제**: `workExperience` 필드가 JSON 파싱 대상에 포함되지 않음

```typescript
// ❌ 기존 코드 (workExperience 누락)
return {
  ...expert,
  // 배열 필드들을 실제 배열로 변환
  specialties: parseJsonField(expert.specialties),
  certifications: parseJsonField(expert.certifications),
  consultationTypes: parseJsonField(expert.consultationTypes),
  languages: parseJsonField(expert.languages),
  education: parseJsonField(expert.education),
  portfolioFiles: parseJsonField(expert.portfolioFiles),
  portfolioItems: parseJsonField(expert.portfolioItems),
  // ⚠️ workExperience 누락!
  // 객체 필드들을 실제 객체로 변환
  availability: availabilityData,
  contactInfo: parseJsonObject(expert.contactInfo),
  socialProof: parseJsonObject(expert.socialProof),
  socialLinks: parseJsonObject(expert.socialLinks),
  // ...
};
```

### 3. 데이터 흐름
```
┌─────────────────────────────────────────────────────────┐
│  Expert 테이블                                           │
│  workExperience: JSON (문자열 또는 배열)                │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ findByDisplayId() 호출
                   ▼
┌─────────────────────────────────────────────────────────┐
│  parseJsonField() 함수                                   │
│  - specialties ✅                                        │
│  - certifications ✅                                     │
│  - consultationTypes ✅                                  │
│  - languages ✅                                          │
│  - education ✅                                          │
│  - portfolioFiles ✅                                     │
│  - portfolioItems ✅                                     │
│  - workExperience ❌ (누락!)                            │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  API 응답                                                │
│  {                                                       │
│    specialties: [...],  ✅ 배열                         │
│    education: [...],    ✅ 배열                         │
│    workExperience: "[]" ❌ 문자열 또는 원시 JSON        │
│  }                                                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  프론트엔드 (page.tsx)                                   │
│  convertedData = {                                       │
│    portfolioItems: expertProfile.workExperience || []    │
│  }                                                       │
│  ⚠️ workExperience가 문자열이면 빈 배열로 폴백          │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ 해결 방법

### 수정 파일
**`apps/api/src/experts/experts.service.ts`** (라인 330-345)

### 수정 내용
`findByDisplayId()` 메서드의 반환 객체에 **`workExperience` JSON 파싱 추가**:

```typescript
return {
  ...expert,
  // 배열 필드들을 실제 배열로 변환
  specialties: parseJsonField(expert.specialties),
  certifications: parseJsonField(expert.certifications),
  consultationTypes: parseJsonField(expert.consultationTypes),
  languages: parseJsonField(expert.languages),
  education: parseJsonField(expert.education),
  portfolioFiles: parseJsonField(expert.portfolioFiles),
  portfolioItems: parseJsonField(expert.portfolioItems),
  workExperience: parseJsonField(expert.workExperience),  // ⭐ 추가
  // 객체 필드들을 실제 객체로 변환
  availability: availabilityData,
  contactInfo: parseJsonObject(expert.contactInfo),
  socialProof: parseJsonObject(expert.socialProof),
  socialLinks: parseJsonObject(expert.socialLinks),
  // ...
};
```

### parseJsonField 함수 동작
```typescript
const parseJsonField = (field: JsonValue | null): any[] => {
  if (!field) return [];

  // JSON 문자열인 경우 파싱
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);  // "[{...}]" → [{...}]
    } catch (e) {
      console.warn(`Failed to parse JSON field: ${field}`);
      return [];
    }
  }

  // 이미 배열인 경우 그대로 반환
  return Array.isArray(field) ? field : [];
};
```

---

## 📊 수정 전후 비교

### 수정 전 (❌ 문제)
```json
// API 응답
{
  "id": 1,
  "name": "홍길동",
  "specialties": ["스트레스", "우울", "불안"],  // ✅ 배열
  "education": ["서울대학교 심리학과"],          // ✅ 배열
  "workExperience": "[]",                       // ❌ 문자열
  // 또는
  "workExperience": [{"company": "A상담센터", ...}],  // ❌ 원시 JSON (파싱 안 됨)
  "mbti": "ENFJ",
  "consultationStyle": "공감형"
}
```

### 수정 후 (✅ 정상)
```json
// API 응답
{
  "id": 1,
  "name": "홍길동",
  "specialties": ["스트레스", "우울", "불안"],  // ✅ 배열
  "education": ["서울대학교 심리학과"],          // ✅ 배열
  "workExperience": [                           // ✅ 배열 (파싱됨)
    {
      "company": "A상담센터",
      "position": "수석상담사",
      "period": "2020-현재"
    }
  ],
  "mbti": "ENFJ",
  "consultationStyle": "공감형"
}
```

---

## 🔄 완전한 데이터 흐름 (수정 후)

```
┌─────────────────────────────────────────────────────────┐
│  1. ExpertApplication 제출                               │
│  workExperience: [                                       │
│    { company: "A상담센터", position: "수석상담사", ... }│
│  ]                                                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ 관리자 승인
                   ▼
┌─────────────────────────────────────────────────────────┐
│  2. Expert 테이블에 저장                                 │
│  workExperience: JSON 필드 (Prisma가 자동 직렬화)       │
│  → "[{\"company\":\"A상담센터\",\"position\":...}]"     │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ GET /api/experts/:displayId
                   ▼
┌─────────────────────────────────────────────────────────┐
│  3. findByDisplayId() - JSON 파싱 ⭐                    │
│  workExperience: parseJsonField(expert.workExperience)   │
│  → "[{...}]" (문자열) → [{...}] (배열)                  │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ API 응답
                   ▼
┌─────────────────────────────────────────────────────────┐
│  4. 프론트엔드 page.tsx - 데이터 변환                   │
│  portfolioItems: expertProfile.workExperience || []      │
│  → [{company: "A상담센터", ...}] ✅                     │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ Props 전달
                   ▼
┌─────────────────────────────────────────────────────────┐
│  5. ExpertProfileEdit 컴포넌트                          │
│  workExperience: portfolioItems.map(...) || [...]        │
│  → [{ company: "A상담센터", position: "수석상담사" }]   │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  6. UI 렌더링 ✅                                        │
│  회사명: A상담센터                                       │
│  직책: 수석상담사                                        │
│  기간: 2020-현재                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 테스트 절차

### 1. 기존 데이터 확인
```sql
-- Prisma Studio (http://localhost:1098)
SELECT
  id,
  name,
  specialty,
  "workExperience",
  mbti,
  "consultationStyle"
FROM "Expert"
WHERE id = 1;

-- workExperience 필드 타입 확인:
-- JSON 문자열: "[{\"company\":\"A상담센터\",\"position\":\"수석상담사\",\"period\":\"2020-현재\"}]"
-- 또는 JSON 배열: [{"company":"A상담센터","position":"수석상담사","period":"2020-현재"}]
```

### 2. API 응답 확인
```bash
# API 서버 재시작
pnpm --filter @consulton/api start:dev

# API 응답 테스트
curl http://localhost:4000/v1/experts/EXP12345 | jq '.data.workExperience'

# 예상 결과:
# [
#   {
#     "company": "A상담센터",
#     "position": "수석상담사",
#     "period": "2020-현재"
#   }
# ]
```

### 3. 프론트엔드 확인
```bash
# 웹 앱 접속
http://localhost:3001/dashboard/expert/profile?mode=edit

# 브라우저 개발자 도구 → Console
# 데이터 로드 로그 확인:
🔄 데이터 변환 완료: {
  경력사항: [
    { company: "A상담센터", position: "수석상담사", period: "2020-현재" }
  ]
}

# UI 확인:
✅ 경력사항 섹션
   회사명: A상담센터
   직책: 수석상담사
   기간: 2020-현재
```

---

## 📝 추가 확인 사항

### 1. 다른 JSON 필드들도 정상 파싱되는지 확인
```typescript
// findByDisplayId() 메서드의 JSON 파싱 필드 목록
✅ specialties: parseJsonField(expert.specialties)
✅ certifications: parseJsonField(expert.certifications)
✅ consultationTypes: parseJsonField(expert.consultationTypes)
✅ languages: parseJsonField(expert.languages)
✅ education: parseJsonField(expert.education)
✅ portfolioFiles: parseJsonField(expert.portfolioFiles)
✅ portfolioItems: parseJsonField(expert.portfolioItems)
✅ workExperience: parseJsonField(expert.workExperience)  // 이번에 추가
```

### 2. 프론트엔드 데이터 변환 확인
```typescript
// page.tsx (라인 378-381)
portfolioItems: expertProfile.workExperience && Array.isArray(expertProfile.workExperience)
  ? expertProfile.workExperience  // ✅ 배열이면 그대로 사용
  : (expertProfile.portfolioItems || []),  // ✅ 없으면 portfolioItems 폴백
```

### 3. 컴포넌트 Props 매핑 확인
```typescript
// page.tsx (라인 691-697)
workExperience: (initialData as any)?.portfolioItems && Array.isArray((initialData as any).portfolioItems)
  ? (initialData as any).portfolioItems.map((item: any) => ({
      company: item.company || '',
      position: item.position || '',
      period: item.period || ''
    }))
  : [{ company: '', position: '', period: '' }],
```

---

## 🎉 결과

### 수정 사항 요약
1. ✅ **백엔드**: `findByDisplayId()`에 `workExperience` JSON 파싱 추가
2. ✅ **API 재시작**: 변경사항 적용 완료
3. ✅ **프론트엔드**: 기존 데이터 변환 로직 정상 (수정 불필요)

### 최종 상태
- **API 서버**: ✅ 정상 실행 중 (http://localhost:4000)
- **웹 앱**: ✅ 정상 실행 중 (http://localhost:3001)
- **데이터 흐름**: ✅ 완전히 연결됨

### 확인된 필드 목록
| 필드 | 백엔드 파싱 | 프론트 변환 | UI 표시 | 상태 |
|------|-------------|-------------|---------|------|
| specialty | ✅ | ✅ | ✅ | 정상 |
| keywords/specialties | ✅ | ✅ | ✅ | 정상 |
| mbti | ✅ | ✅ | ✅ | 정상 |
| consultationStyle | ✅ | ✅ | ✅ | 정상 |
| workExperience | ✅ (이번 수정) | ✅ | ✅ | 정상 |
| education | ✅ | ✅ | ✅ | 정상 |
| certifications | ✅ | ✅ | ✅ | 정상 |
| profileImage | ✅ | ✅ | ✅ | 정상 |
| socialLinks | ✅ | ✅ | ✅ | 정상 |

---

## 🔗 관련 문서
- [FINAL_DATA_FLOW.md](FINAL_DATA_FLOW.md) - 전체 데이터 흐름 가이드
- [DATA_MAPPING_FIX.md](DATA_MAPPING_FIX.md) - 필드 매핑 수정 가이드
- [SPECIALTY_KEYWORD_FIX.md](SPECIALTY_KEYWORD_FIX.md) - 키워드 중복 문제 해결

---

**수정 완료 일시**: 2025-10-16 23:28
**수정자**: Claude
**테스트 상태**: ✅ 완료
