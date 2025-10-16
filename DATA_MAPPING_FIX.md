# 전문가 프로필 데이터 매핑 문제 수정 완료

## 🔍 발견된 문제

전문가 지원서 제출 → 관리자 승인 → 프로필 편집 모드로 데이터가 흐르지 않는 문제가 있었습니다.

### 근본 원인

**백엔드 API 필드명**과 **프론트엔드 컴포넌트가 기대하는 필드명**이 서로 달랐습니다:

| 데이터 | 백엔드 (Expert 테이블) | 프론트엔드 (ExpertProfileEdit) |
|-------|----------------------|-------------------------------|
| 프로필 이미지 | `avatarUrl` | `profileImage` |
| 자기소개 | `bio` | `description` → `bio` |
| 경력 | `experienceYears` | `experience` |
| 키워드/전문분야 | `specialties` (배열) | `keywords` (배열) |
| 경력사항 | `workExperience` (배열) | `workExperience` |
| MBTI | `mbti` | `mbti` |
| 상담스타일 | `consultationStyle` | `consultationStyle` |
| 소셜링크 | `socialLinks` (객체) | `socialLinks` (객체) |

### 데이터 흐름 단절 지점

1. **백엔드 → 프론트엔드 로드 시**:
   - `apps/web/src/app/dashboard/expert/profile/page.tsx`의 288-395줄
   - API 응답을 프론트엔드 형식으로 변환하는 로직이 불완전했음

2. **프론트엔드 컴포넌트 전달 시**:
   - `apps/web/src/app/dashboard/expert/profile/page.tsx`의 676-749줄
   - `ExpertProfileEdit` 컴포넌트에 데이터 전달 시 필드 매핑이 불완전했음
   - **특히 문제가 된 필드들**:
     - `mbti`: 빈 문자열 `''`로 하드코딩됨
     - `consultationStyle`: 빈 문자열 `''`로 하드코딩됨
     - `workExperience`: 빈 배열로 하드코딩됨

## ✅ 적용된 수정사항

### 1. 백엔드 → 프론트엔드 데이터 변환 로직 개선

**파일**: `apps/web/src/app/dashboard/expert/profile/page.tsx` (288-395줄)

```typescript
// 개선된 변환 로직
const convertedData = {
  // ... 기존 필드들 ...

  // 배열 필드 - null/undefined 체크 강화
  education: expertProfile.education && Array.isArray(expertProfile.education) && expertProfile.education.length > 0
    ? expertProfile.education
    : [""],

  // keywords 우선, 없으면 specialties 사용
  specialties: expertProfile.specialties && Array.isArray(expertProfile.specialties) && expertProfile.specialties.length > 0
    ? expertProfile.specialties
    : (expertProfile.keywords && Array.isArray(expertProfile.keywords) && expertProfile.keywords.length > 0
      ? expertProfile.keywords
      : [expertProfile.specialty || ""]),

  // 소셜 링크 객체 매핑
  socialLinks: expertProfile.socialLinks || {
    linkedin: "",
    github: "",
    twitter: "",
    instagram: "",
    facebook: "",
    youtube: ""
  },

  // avatarUrl → profileImage 매핑
  profileImage: expertProfile.avatarUrl || expertProfile.profileImage || null,

  // workExperience → portfolioItems 매핑
  portfolioItems: expertProfile.workExperience && Array.isArray(expertProfile.workExperience)
    ? expertProfile.workExperience
    : (expertProfile.portfolioItems || []),

  // MBTI 및 상담 스타일 추가
  mbti: expertProfile.mbti || "",
  consultationStyle: expertProfile.consultationStyle || "",

  // 프로필 완성도
  isProfileComplete: expertProfile?.isProfileComplete === true,
};

console.log('🔄 데이터 변환 완료:', {
  원본_필드명: Object.keys(expertProfile),
  변환된_데이터: convertedData,
  MBTI: expertProfile.mbti,
  상담스타일: expertProfile.consultationStyle,
  경력사항: expertProfile.workExperience,
  키워드: expertProfile.keywords || expertProfile.specialties,
  프로필이미지: expertProfile.avatarUrl,
});
```

### 2. ExpertProfileEdit 컴포넌트 데이터 전달 개선

**파일**: `apps/web/src/app/dashboard/expert/profile/page.tsx` (676-749줄)

```typescript
<ExpertProfileEdit
  ref={expertProfileRef}
  expertData={{
    // ... 기존 필드들 ...

    // 키워드 - specialties를 keywords로 매핑
    keywords: initialData?.specialties || [],

    // 경력사항 - portfolioItems를 workExperience로 매핑
    workExperience: (initialData as any)?.portfolioItems && Array.isArray((initialData as any).portfolioItems)
      ? (initialData as any).portfolioItems.map((item: any) => ({
          company: item.company || '',
          position: item.position || '',
          period: item.period || ''
        }))
      : [{ company: '', position: '', period: '' }],

    // 학력 - 문자열 배열 또는 객체 배열로 변환
    education: Array.isArray(initialData?.education)
      ? (initialData.education as any[]).map(edu => {
          if (typeof edu === 'string') {
            return { school: edu, major: '', degree: '' };
          } else {
            return {
              school: edu.school || '',
              major: edu.major || '',
              degree: edu.degree || ''
            };
          }
        })
      : [{ school: '', major: '', degree: '' }],

    // ⭐ MBTI & 상담 스타일 - initialData에서 실제 데이터 가져오기
    mbti: (initialData as any)?.mbti || '',
    consultationStyle: (initialData as any)?.consultationStyle || '',

    // 소셜 링크 - socialLinks 객체에서 가져오기
    socialLinks: {
      website: initialData?.socialLinks?.linkedin || initialData?.contactInfo?.website || '',
      instagram: initialData?.socialLinks?.instagram || '',
      youtube: initialData?.socialLinks?.youtube || '',
      linkedin: initialData?.socialLinks?.linkedin || '',
      blog: (initialData?.socialLinks as any)?.blog || ''
    },
  }}
  onSave={handleSave}
/>
```

### 3. TypeScript 타입 정의 개선

**파일**: `apps/web/src/app/dashboard/expert/profile/page.tsx` (34-81줄)

```typescript
type ExpertProfileData = {
  // ... 기존 필드들 ...

  // 추가 필드들 (백엔드에서 전송되는 필드)
  portfolioItems?: any[];
  mbti?: string;
  consultationStyle?: string;
};
```

## 🧪 테스트 방법

### 1. 전문가 지원서 제출 (테스트 데이터)

브라우저에서 전문가 지원 페이지 접속 후 다음 데이터로 제출:

```
이름: "김전문가"
이메일: "expert@test.com"
전문 분야: "커리어 코칭"
경력: 5년
자기소개: "10년 이상의 커리어 코칭 경험을 가진 전문가입니다..."
키워드: ["커리어", "리더십", "이직"]
MBTI: "ENFJ"
상담 스타일: "공감형, 해결책 제시형"
경력사항: [
  { company: "A기업", position: "HR 팀장", period: "2018-2023" }
]
학력: ["서울대학교 심리학과"]
상담 유형: ["video", "chat"]
```

### 2. 관리자 승인

```sql
-- 데이터베이스에서 확인
SELECT
  id, "displayId", name, specialty, "experienceYears",
  mbti, "consultationStyle", "workExperience", specialties
FROM "Expert"
WHERE email = 'expert@test.com';

-- 예상 결과:
-- mbti: "ENFJ"
-- consultationStyle: "공감형, 해결책 제시형"
-- workExperience: [{"company": "A기업", "position": "HR 팀장", ...}]
-- specialties: ["커리어", "리더십", "이직"]
```

### 3. 프로필 편집 모드 확인

```
1. 승인된 전문가 계정으로 로그인
2. /dashboard/expert/profile 접속
3. 브라우저 개발자 도구 콘솔 확인

예상 로그:
🔄 데이터 변환 완료: {
  MBTI: "ENFJ",
  상담스타일: "공감형, 해결책 제시형",
  경력사항: [{ company: "A기업", ... }],
  키워드: ["커리어", "리더십", "이직"],
  프로필이미지: "data:image/jpeg;base64,..."
}
```

### 4. UI 필드 확인

프로필 편집 페이지에서 다음 필드들이 채워져 있어야 합니다:

- ✅ **프로필 사진**: 업로드된 이미지 표시
- ✅ **키워드**: "커리어, 리더십, 이직"
- ✅ **MBTI**: "ENFJ"
- ✅ **상담 스타일**: "공감형, 해결책 제시형"
- ✅ **경력사항**:
  - 회사명: "A기업"
  - 직책: "HR 팀장"
  - 기간: "2018-2023"
- ✅ **학력**: "서울대학교 심리학과"
- ✅ **소셜 링크**: (입력된 경우) 링크 표시

### 5. 저장 후 재로드 테스트

```
1. 프로필 편집 모드에서 데이터 수정
   예: MBTI를 "ENFJ" → "INFP"로 변경

2. "저장하기" 버튼 클릭

3. 페이지 새로고침 (F5)

4. 프로필 편집 모드로 다시 진입

5. 변경된 데이터가 유지되는지 확인
   예상: MBTI가 "INFP"로 표시됨
```

## 📊 데이터 흐름 검증

### 전체 데이터 흐름

```
┌─────────────────────────────────────────────┐
│ 1. 전문가 지원서 제출                         │
│    - MBTI: "ENFJ"                           │
│    - consultationStyle: "공감형"             │
│    - workExperience: [...]                  │
│    - specialties: ["키워드1", "키워드2"]      │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ 2. 관리자 승인 (Prisma Transaction)          │
│    Expert 테이블에 모든 데이터 저장            │
│    - avatarUrl: "data:image..."             │
│    - mbti: "ENFJ"                           │
│    - consultationStyle: "공감형"             │
│    - workExperience: JSON 배열               │
│    - specialties: JSON 배열                  │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ 3. API GET /experts/:displayId              │
│    백엔드 응답:                               │
│    {                                        │
│      avatarUrl: "...",                      │
│      mbti: "ENFJ",                          │
│      consultationStyle: "공감형",            │
│      workExperience: [...],                 │
│      specialties: [...]                     │
│    }                                        │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ 4. 프론트엔드 데이터 변환 (page.tsx)          │
│    convertedData:                           │
│    {                                        │
│      profileImage: avatarUrl,               │
│      mbti: "ENFJ",                          │
│      consultationStyle: "공감형",            │
│      portfolioItems: workExperience,        │
│      specialties: [...]                     │
│    }                                        │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ 5. ExpertProfileEdit 컴포넌트 전달            │
│    expertData:                              │
│    {                                        │
│      profileImage: "...",                   │
│      keywords: specialties,                 │
│      mbti: "ENFJ",                          │
│      consultationStyle: "공감형",            │
│      workExperience: portfolioItems         │
│    }                                        │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ 6. UI 렌더링                                 │
│    - MBTI 입력 필드: "ENFJ" 표시             │
│    - 상담스타일 입력 필드: "공감형" 표시       │
│    - 경력사항 섹션: 회사, 직책, 기간 표시      │
│    - 키워드 태그: 입력된 키워드들 표시         │
└─────────────────────────────────────────────┘
```

## 🐛 디버깅 가이드

### 브라우저 콘솔에서 확인할 로그

1. **데이터 로드 시**:
```javascript
✅ 데이터베이스에서 프로필 로드 성공: { ... }
🔄 데이터 변환 완료: {
  MBTI: "ENFJ",
  상담스타일: "공감형, 해결책 제시형",
  ...
}
💾 프로필 페이지에서 ExpertProfilePreview로 전달되는 데이터: { ... }
```

2. **데이터가 비어있는 경우**:
```javascript
⚠️ 데이터베이스 응답 실패: { error: ... }
```
→ 백엔드 API 응답 확인 필요

3. **필드가 undefined인 경우**:
```javascript
🔄 데이터 변환 완료: {
  MBTI: undefined,  // ❌ 문제!
  ...
}
```
→ 백엔드 Expert 테이블에 mbti 필드가 null인지 확인

### 데이터베이스 직접 확인

```sql
-- Expert 테이블의 JSON 필드 확인
SELECT
  id,
  name,
  mbti,
  "consultationStyle",
  "workExperience"::text,
  specialties::text,
  "socialLinks"::text
FROM "Expert"
WHERE name = '테스트전문가이름';
```

### API 응답 확인

```bash
# displayId로 프로필 조회
curl -X GET "http://localhost:4000/v1/experts/EXP1697123456789" \
  -H "Content-Type: application/json" | jq

# 예상 응답:
{
  "success": true,
  "data": {
    "displayId": "EXP...",
    "name": "김전문가",
    "mbti": "ENFJ",
    "consultationStyle": "공감형, 해결책 제시형",
    "workExperience": [...],
    "specialties": [...],
    "avatarUrl": "data:image/jpeg;base64,..."
  }
}
```

## ✅ 검증 체크리스트

프로필 편집 페이지에서 다음 항목들이 모두 표시되는지 확인:

### 기본 정보
- [ ] 이름
- [ ] 전문 분야
- [ ] 경력 (숫자)
- [ ] 자기소개 (30자 이상)

### 프로필 사진
- [ ] 업로드된 이미지가 표시됨
- [ ] 이미지가 없으면 기본 아바타 표시

### 키워드/전문분야
- [ ] 지원서에 입력한 키워드들이 태그로 표시됨
- [ ] 키워드 추가/삭제 가능

### MBTI 및 상담 스타일 ⭐
- [ ] MBTI 입력 필드에 값이 표시됨 (예: "ENFJ")
- [ ] 상담 스타일 입력 필드에 값이 표시됨 (예: "공감형, 해결책 제시형")

### 경력사항 ⭐
- [ ] 회사명이 표시됨
- [ ] 직책이 표시됨
- [ ] 재직 기간이 표시됨
- [ ] 여러 경력이 있는 경우 모두 표시됨

### 학력
- [ ] 학교명이 표시됨
- [ ] 전공이 표시됨 (있는 경우)
- [ ] 학위가 표시됨 (있는 경우)

### 예약 가능 시간
- [ ] 예약 가능 시간 설정 UI가 표시됨
- [ ] 슬롯 추가/삭제 가능

### 소셜 링크 ⭐
- [ ] 웹사이트 URL (있는 경우)
- [ ] LinkedIn (있는 경우)
- [ ] Instagram (있는 경우)
- [ ] YouTube (있는 경우)
- [ ] 블로그 (있는 경우)

## 🎯 수정의 핵심 포인트

1. **필드명 불일치 해결**: 백엔드 `avatarUrl` → 프론트엔드 `profileImage`
2. **MBTI/상담스타일 하드코딩 제거**: 실제 데이터를 `initialData`에서 가져옴
3. **경력사항 매핑**: `portfolioItems`를 `workExperience` 형식으로 변환
4. **배열 필드 안전성**: null/undefined 체크 강화
5. **소셜링크 객체 매핑**: `socialLinks` 객체 전체를 올바르게 전달
6. **디버깅 로그 추가**: 데이터 변환 과정을 콘솔에서 확인 가능

---

**수정 완료 일시**: 2025-10-16
**수정된 파일**:
- `apps/web/src/app/dashboard/expert/profile/page.tsx`

**테스트 환경**:
- API 서버: http://localhost:4000
- 웹 앱: http://localhost:3001

**다음 단계**: 실제 전문가 지원서를 제출하고 승인 후 프로필 편집 페이지에서 모든 데이터가 올바르게 표시되는지 확인
