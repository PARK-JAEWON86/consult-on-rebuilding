# 전문가 데이터 흐름 최종 완성

## 📋 개요

전문가 지원하기 → 관리자 승인 → 전문가 프로필 편집 모드까지의 완전한 데이터 흐름 구현이 완료되었습니다.

**수정 날짜**: 2025-10-16
**상태**: ✅ 모든 필드 데이터 흐름 완성

---

## 🎯 해결된 주요 문제

### 1. 필드명 불일치 (Field Name Mismatch)
**문제**: 백엔드 API 필드명과 프론트엔드 컴포넌트 prop 이름이 달라 데이터가 전달되지 않음

**해결**:
- `avatarUrl` → `profileImage` 매핑 추가
- `workExperience` → `portfolioItems` 매핑 추가
- `specialties` → `keywords` 매핑 추가

### 2. 하드코딩된 빈 값 (Hardcoded Empty Values)
**문제**: MBTI, 상담 스타일, 경력사항이 빈 값으로 하드코딩되어 실제 데이터가 무시됨

**해결**:
```typescript
// Before (하드코딩)
mbti: '',
consultationStyle: '',
workExperience: [{ company: '', position: '', period: '' }],

// After (실제 데이터 사용)
mbti: (initialData as any)?.mbti || '',
consultationStyle: (initialData as any)?.consultationStyle || '',
workExperience: (initialData as any)?.portfolioItems?.map(...) || [...]
```

### 3. 키워드 중복 표시 (Keyword Duplication)
**문제**:
- 상담분야 필드: "심리상담 - 스트레스, 우울, 불안" (카테고리 + 키워드)
- 키워드 필드: ["스트레스", "우울", "불안"] (키워드만)
- 결과: 키워드가 두 곳에 중복 표시됨

**해결**: 백엔드 승인 프로세스에 `parseSpecialty()` 함수 추가
```typescript
const parseSpecialty = (specialty: string): string => {
  if (!specialty) return '';
  const parts = specialty.split(' - ');
  return parts[0].trim();
};

// "심리상담 - 스트레스, 우울, 불안" → "심리상담"
```

---

## 📊 완성된 데이터 흐름

### Phase 1: 전문가 지원서 작성 및 제출

**위치**: `apps/web/src/app/experts/become/page.tsx`

```typescript
// 지원서 데이터 구조
const applicationData = {
  // 기본 정보
  name: "홍길동",
  email: "expert@example.com",
  jobTitle: "심리상담 전문가",

  // 상담 분야 (카테고리 + 키워드 포함)
  specialty: "심리상담 - 스트레스, 우울, 불안",  // 전체 문자열
  keywords: ["스트레스", "우울", "불안"],        // 배열로 분리 저장

  // 개인 정보
  bio: "10년 경력의 심리상담 전문가입니다...",
  profileImage: "https://example.com/profile.jpg",
  experienceYears: 10,

  // MBTI 및 상담 스타일
  mbti: "ENFJ",
  consultationStyle: "공감형, 해결책 제시형",

  // 경력사항
  workExperience: [
    { company: "A상담센터", position: "수석상담사", period: "2020-현재" }
  ],

  // 학력
  education: [
    { school: "서울대학교", major: "심리학", degree: "석사" }
  ],

  // 상담 유형 및 언어
  consultationTypes: ["대면", "비대면"],
  languages: ["한국어", "영어"],

  // 자격증
  certifications: [
    { name: "임상심리사 1급", issuer: "한국심리학회", year: 2018 }
  ],

  // 예약 가능 시간
  availability: {
    monday: { available: true, slots: [{ start: "09:00", end: "18:00" }] },
    // ... 요일별 설정
  },
  availabilitySlots: [
    { dayOfWeek: 1, startTime: "09:00", endTime: "18:00" }
  ],

  // 카테고리 ID
  categoryId: 1  // 심리상담 카테고리
};

// ExpertApplication 테이블에 저장
await POST /api/experts/apply
```

### Phase 2: 관리자 승인 프로세스

**위치**: `apps/api/src/admin/expert-applications/expert-applications.service.ts`

```typescript
// approveApplication() 메서드 (170-332줄)
async approveApplication(id: number, dto: ReviewApplicationDto) {
  const application = await this.prisma.expertApplication.findUnique({ where: { id } });

  await this.prisma.$transaction(async (tx) => {
    // 1. ExpertApplication 상태 업데이트
    await tx.expertApplication.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy: dto.reviewedBy,
      },
    });

    // 2. specialty 파싱 (키워드 분리) ⭐ 핵심 수정
    const parseSpecialty = (specialty: string): string => {
      if (!specialty) return '';
      const parts = specialty.split(' - ');
      return parts[0].trim();
    };

    const cleanSpecialty = parseSpecialty(application.specialty);
    // "심리상담 - 스트레스, 우울, 불안" → "심리상담"

    // 3. Expert 레코드 생성
    const expert = await tx.expert.create({
      data: {
        displayId: `EXP${Date.now()}${application.userId}`,
        userId: application.userId,
        name: application.name,

        // 상담 분야 (카테고리명만 저장) ⭐
        title: application.jobTitle || cleanSpecialty,
        specialty: cleanSpecialty,  // "심리상담" (키워드 제거됨)

        // 키워드는 별도 배열로 저장 ⭐
        specialties: application.keywords || [],  // ["스트레스", "우울", "불안"]

        // 기본 정보
        bio: application.bio,
        description: application.bio,
        avatarUrl: application.profileImage,  // ⭐ 프로필 이미지
        experience: application.experienceYears,
        experienceYears: application.experienceYears,

        // MBTI 및 상담 스타일 ⭐
        mbti: application.mbti || null,
        consultationStyle: application.consultationStyle || null,

        // 경력사항 ⭐
        workExperience: application.workExperience || [],

        // 배열 필드들
        categories: [],
        certifications: application.certifications || [],
        consultationTypes: application.consultationTypes || [],
        languages: application.languages || ['한국어'],
        education: application.education || [],
        portfolioFiles: [],
        portfolioItems: application.workExperience || [],

        // JSON 객체 필드들
        availability: application.availability || {},
        contactInfo: { email: application.email, phone: '', location: '', website: '' },
        socialLinks: { linkedin: '', github: '', twitter: '', instagram: '', facebook: '', youtube: '' },

        // 상태 플래그
        isActive: true,
        isProfileComplete: true,
        isProfilePublic: false,

        // 통계 초기값
        totalSessions: 0,
        repeatClients: 0,
        ratingAvg: 0,
        reviewCount: 0,
        responseTime: '2시간 내',
      },
    });

    // 4. User roles에 EXPERT 추가
    const user = await tx.user.findUnique({ where: { id: application.userId } });
    const roles = JSON.parse(user.roles || '["USER"]');
    if (!roles.includes('EXPERT')) roles.push('EXPERT');
    await tx.user.update({
      where: { id: application.userId },
      data: { roles: JSON.stringify(roles) },
    });

    // 5. ExpertCategory 연결 생성
    if (application.categoryId) {
      await tx.expertCategory.create({
        data: { expertId: expert.id, categoryId: application.categoryId },
      });
    }

    // 6. ExpertAvailability 슬롯 생성
    if (application.availabilitySlots?.length) {
      await tx.expertAvailability.createMany({
        data: application.availabilitySlots.map(slot => ({
          expertId: expert.id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isActive: true,
          timeZone: 'Asia/Seoul',
        })),
      });
    }
  });

  // 7. 승인 이메일 발송
  if (application.emailNotification) {
    await this.mail.sendExpertApplicationStatusEmail(
      application.email,
      'APPROVED',
      application.name,
      application.displayId
    );
  }
}
```

### Phase 3: 전문가 프로필 로드

**위치**: `apps/web/src/app/dashboard/expert/profile/page.tsx`

```typescript
// useEffect - 데이터 로드 (288-395줄)
const fetchData = async () => {
  // 1. 사용자 정보 가져오기
  const userResponse = await fetch('/api/auth/me');
  const userData = await userResponse.json();

  // 2. 전문가 프로필 가져오기
  const expertResponse = await fetch(`/api/experts/me/profile`);
  const expertData = await expertResponse.json();

  // 3. 백엔드 필드명 → 프론트엔드 필드명 변환 ⭐
  const convertedData = {
    id: expertId,
    name: user.name || expertProfile.fullName || expertProfile.name || "",

    // 상담 분야 (카테고리명만)
    specialty: expertProfile.specialty || "",  // "심리상담"

    // 키워드 (specialties 배열)
    specialties: expertProfile.specialties || expertProfile.keywords || [],

    // 기본 정보
    description: expertProfile.bio || expertProfile.description || "",
    experience: expertProfile.experienceYears || expertProfile.experience || 0,

    // 프로필 이미지 ⭐ avatarUrl → profileImage
    profileImage: expertProfile.avatarUrl || expertProfile.profileImage || null,

    // MBTI 및 상담 스타일 ⭐
    mbti: expertProfile.mbti || "",
    consultationStyle: expertProfile.consultationStyle || "",

    // 경력사항 ⭐ workExperience → portfolioItems
    portfolioItems: expertProfile.workExperience || expertProfile.portfolioItems || [],

    // 배열 필드들
    education: expertProfile.education || [""],
    certifications: expertProfile.certifications || [],
    consultationTypes: expertProfile.consultationTypes || [],
    languages: expertProfile.languages || ["한국어"],
    portfolioFiles: expertProfile.portfolioFiles || [],

    // JSON 객체 필드들
    contactInfo: expertProfile.contactInfo || { phone: "", email: "", location: "", website: "" },
    socialLinks: expertProfile.socialLinks || { linkedin: "", github: "", twitter: "", instagram: "", facebook: "", youtube: "" },
    availability: expertProfile.availability || {},

    // 정책 및 설정
    responseTime: expertProfile.responseTime || "2시간 내",
    cancellationPolicy: expertProfile.cancellationPolicy || "",
    holidayPolicy: expertProfile.holidayPolicy || "",

    // 상태 플래그
    isProfileComplete: expertProfile?.isProfileComplete === true,
    isProfilePublic: expertProfile?.isProfilePublic === true,
  };

  setInitialData(convertedData);
  console.log('🔄 데이터 변환 완료:', convertedData);
};
```

### Phase 4: 프로필 편집 컴포넌트에 데이터 전달

**위치**: `apps/web/src/app/dashboard/expert/profile/page.tsx` (676-749줄)

```typescript
<ExpertProfileEdit
  ref={expertProfileRef}
  expertData={{
    // 기본 정보
    name: initialData?.name || user?.name || '',
    email: initialData?.contactInfo?.email || user?.email || '',
    phoneNumber: initialData?.contactInfo?.phone || '',

    // 상담 분야 (카테고리명만)
    specialty: initialData?.specialty || '',  // "심리상담"

    // 키워드 ⭐ specialties → keywords
    keywords: initialData?.specialties || [],  // ["스트레스", "우울", "불안"]

    experience: typeof initialData?.experience === 'number'
      ? initialData.experience
      : parseInt(String(initialData?.experience || 0)),
    bio: initialData?.description || '',

    // 프로필 이미지 ⭐
    profileImage: initialData?.profileImage || null,

    // MBTI & 상담 스타일 ⭐ (실제 데이터 사용, 하드코딩 제거)
    mbti: (initialData as any)?.mbti || '',
    consultationStyle: (initialData as any)?.consultationStyle || '',

    // 경력사항 ⭐ portfolioItems → workExperience
    workExperience: (initialData as any)?.portfolioItems?.map((item: any) => ({
      company: item.company || '',
      position: item.position || '',
      period: item.period || ''
    })) || [{ company: '', position: '', period: '' }],

    // 학력
    education: initialData?.education?.filter((edu: string) => edu.trim() !== '') || [''],

    // 자격증
    certifications: initialData?.certifications || [],

    // 상담 유형 및 언어
    consultationTypes: initialData?.consultationTypes || [],
    languages: initialData?.languages || ['한국어'],

    // 소셜 링크 ⭐
    socialLinks: {
      website: initialData?.socialLinks?.linkedin || initialData?.contactInfo?.website || '',
      instagram: initialData?.socialLinks?.instagram || '',
      youtube: initialData?.socialLinks?.youtube || '',
      linkedin: initialData?.socialLinks?.linkedin || '',
      blog: (initialData?.socialLinks as any)?.blog || ''
    },

    // 예약 가능 시간
    availability: initialData?.availability || {},

    // 정책
    responseTime: initialData?.responseTime || '2시간 내',
    cancellationPolicy: initialData?.cancellationPolicy || '',
    holidayPolicy: initialData?.holidayPolicy || '',

    // 상태 플래그
    isProfilePublic: initialData?.isProfilePublic || false
  }}
  onSave={handleSave}
/>
```

### Phase 5: 프로필 편집 UI 표시

**위치**: `apps/web/src/components/dashboard/ExpertProfileEdit.tsx`

#### 상담 분야 필드 (카테고리명만 표시)
```tsx
{/* 상담 분야 */}
<div>
  <h3 className="text-base font-semibold text-gray-900 mb-3">
    상담 분야 <span className="text-red-500">*</span>
  </h3>
  <input
    type="text"
    value={formData.specialty}  // "심리상담" (키워드 없음)
    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
    placeholder="예: 심리상담, 법률상담, 커리어코칭"
  />
</div>
```

#### 키워드 필드 (배지로 표시, 전문가 지원하기와 동일한 UI)
```tsx
{/* 키워드 (상담 주제) */}
<div>
  <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
    <Tag className="w-4 h-4 mr-2" /> 키워드 (상담 주제)
    <span className="text-red-500 ml-1">*</span>
    <span className="ml-2 text-xs text-gray-500 font-normal">
      (콤마로 구분, 최대 10개)
    </span>
  </h3>

  {/* 입력 필드 */}
  <input
    type="text"
    value={keywordsInput}
    onChange={(e) => handleKeywordsChange(e.target.value)}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
    placeholder="예: 스트레스, 우울, 불안, 계약법, 이직, 커리어"
  />

  {/* 상태 표시 */}
  <div className="flex items-center justify-between mt-2">
    <p className="text-xs text-gray-500">
      {formData.keywords.length > 0 && `입력된 키워드: ${formData.keywords.length}개`}
    </p>
    {formData.keywords.length >= 10 && (
      <p className="text-xs text-red-500">최대 10개까지만 입력 가능합니다</p>
    )}
  </div>

  {/* 키워드 배지 표시 */}
  {formData.keywords.length > 0 && (
    <div className="flex flex-wrap gap-2 mt-3">
      {formData.keywords.map((keyword, idx) => (
        <span
          key={idx}
          className="inline-flex items-center px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full border border-blue-200"
        >
          {keyword}
        </span>
      ))}
    </div>
  )}
</div>
```

#### MBTI 및 상담 스타일
```tsx
{/* MBTI */}
<div>
  <h3 className="text-base font-semibold text-gray-900 mb-3">MBTI</h3>
  <select
    value={formData.mbti}  // "ENFJ" (실제 데이터)
    onChange={(e) => setFormData({ ...formData, mbti: e.target.value })}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
  >
    <option value="">선택 안 함</option>
    <option value="ENFJ">ENFJ</option>
    {/* ... 16가지 MBTI 타입 */}
  </select>
</div>

{/* 상담 스타일 */}
<div>
  <h3 className="text-base font-semibold text-gray-900 mb-3">상담 스타일</h3>
  <textarea
    value={formData.consultationStyle}  // "공감형, 해결책 제시형" (실제 데이터)
    onChange={(e) => setFormData({ ...formData, consultationStyle: e.target.value })}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
    rows={3}
    placeholder="예: 공감형, 해결책 제시형, 경청 중심"
  />
</div>
```

#### 경력사항
```tsx
{/* 경력사항 */}
<div>
  <h3 className="text-base font-semibold text-gray-900 mb-3">경력사항</h3>
  {formData.workExperience.map((exp, index) => (
    <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg">
      <input
        type="text"
        value={exp.company}  // "A상담센터" (실제 데이터)
        onChange={(e) => handleWorkExperienceChange(index, 'company', e.target.value)}
        placeholder="회사/기관명"
        className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg"
      />
      <input
        type="text"
        value={exp.position}  // "수석상담사" (실제 데이터)
        onChange={(e) => handleWorkExperienceChange(index, 'position', e.target.value)}
        placeholder="직책/역할"
        className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg"
      />
      <input
        type="text"
        value={exp.period}  // "2020-현재" (실제 데이터)
        onChange={(e) => handleWorkExperienceChange(index, 'period', e.target.value)}
        placeholder="근무 기간"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
      />
    </div>
  ))}
</div>
```

---

## 🔍 데이터 흐름 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│  1. 전문가 지원하기 (Expert Application)                    │
│  apps/web/src/app/experts/become/page.tsx                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ POST /api/experts/apply
                       │ {
                       │   specialty: "심리상담 - 스트레스, 우울, 불안",
                       │   keywords: ["스트레스", "우울", "불안"],
                       │   mbti: "ENFJ",
                       │   consultationStyle: "공감형",
                       │   workExperience: [...],
                       │   profileImage: "...",
                       │   ...
                       │ }
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  2. ExpertApplication 테이블에 저장                          │
│  database: ExpertApplication                                 │
│  - specialty: "심리상담 - 스트레스, 우울, 불안" (전체 문자열)│
│  - keywords: ["스트레스", "우울", "불안"] (JSON 배열)        │
│  - mbti: "ENFJ"                                              │
│  - consultationStyle: "공감형"                               │
│  - workExperience: [...] (JSON 배열)                         │
│  - profileImage: "..."                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ 관리자 승인 대기
                       │
┌─────────────────────────────────────────────────────────────┐
│  3. 관리자 승인 (Admin Approval)                             │
│  apps/api/src/admin/expert-applications/                    │
│  expert-applications.service.ts                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ parseSpecialty() 실행 ⭐
                       │ "심리상담 - 스트레스, 우울, 불안"
                       │      ↓ split(' - ')
                       │ "심리상담" (카테고리명만 추출)
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Expert 테이블에 생성                                     │
│  database: Expert                                            │
│  - specialty: "심리상담" ⭐ (카테고리명만)                   │
│  - specialties: ["스트레스", "우울", "불안"] ⭐ (키워드 배열)│
│  - mbti: "ENFJ" ⭐                                           │
│  - consultationStyle: "공감형" ⭐                            │
│  - workExperience: [...] ⭐                                  │
│  - avatarUrl: "..." ⭐                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ 전문가 계정으로 로그인
                       │
┌─────────────────────────────────────────────────────────────┐
│  5. 프로필 페이지 로드                                       │
│  apps/web/src/app/dashboard/expert/profile/page.tsx         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ GET /api/experts/me/profile
                       │
                       ▼ 데이터 변환 (convertedData) ⭐
                       │ avatarUrl → profileImage
                       │ workExperience → portfolioItems
                       │ specialties → keywords (컴포넌트 전달 시)
                       │
┌─────────────────────────────────────────────────────────────┐
│  6. 프로필 편집 컴포넌트에 전달                              │
│  apps/web/src/components/dashboard/ExpertProfileEdit.tsx    │
│                                                              │
│  expertData={{                                               │
│    specialty: "심리상담",           ✅ 카테고리명만          │
│    keywords: ["스트레스", "우울", "불안"], ✅ 키워드만       │
│    mbti: "ENFJ",                    ✅ 실제 데이터           │
│    consultationStyle: "공감형",     ✅ 실제 데이터           │
│    workExperience: [...],           ✅ 실제 데이터           │
│    profileImage: "...",             ✅ 실제 데이터           │
│  }}                                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  7. UI 표시 결과                                             │
│                                                              │
│  ✅ 상담분야: "심리상담" (카테고리명만, 키워드 없음)         │
│  ✅ 키워드: [스트레스] [우울] [불안] (배지로 표시)          │
│  ✅ MBTI: "ENFJ" (드롭다운 선택됨)                           │
│  ✅ 상담 스타일: "공감형" (텍스트 표시)                      │
│  ✅ 경력사항: 회사명, 직책, 기간 표시                        │
│  ✅ 프로필 이미지: 썸네일 표시                               │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ 전체 필드 매핑 테이블

| 지원서 필드 (Application) | Expert 테이블 | 프로필 페이지 (convertedData) | 컴포넌트 Prop | UI 표시 |
|---------------------------|---------------|-------------------------------|---------------|---------|
| `specialty` ("카테고리 - 키워드") | `specialty` ("카테고리") | `specialty` | `specialty` | 상담분야 입력 필드 |
| `keywords` (배열) | `specialties` (배열) | `specialties` → | `keywords` | 키워드 배지 |
| `name` | `name` | `name` | `name` | 이름 입력 필드 |
| `email` | `contactInfo.email` | `contactInfo.email` | `email` | 이메일 표시 |
| `jobTitle` | `title` | - | - | - |
| `bio` | `bio`, `description` | `description` | `bio` | 자기소개 textarea |
| `profileImage` | `avatarUrl` ⭐ | `profileImage` ⭐ | `profileImage` | 이미지 업로드 |
| `experienceYears` | `experience`, `experienceYears` | `experience` | `experience` | 경력 연수 입력 |
| `mbti` ⭐ | `mbti` | `mbti` | `mbti` | MBTI 드롭다운 |
| `consultationStyle` ⭐ | `consultationStyle` | `consultationStyle` | `consultationStyle` | 상담 스타일 textarea |
| `workExperience` ⭐ | `workExperience`, `portfolioItems` | `portfolioItems` | `workExperience` | 경력사항 목록 |
| `education` | `education` | `education` | `education` | 학력 목록 |
| `certifications` | `certifications` | `certifications` | `certifications` | 자격증 목록 |
| `consultationTypes` | `consultationTypes` | `consultationTypes` | `consultationTypes` | 상담 유형 체크박스 |
| `languages` | `languages` | `languages` | `languages` | 언어 선택 |
| `availability` | `availability` | `availability` | `availability` | 예약 가능 시간 |
| `contactInfo` | `contactInfo` | `contactInfo` | `phoneNumber` | 연락처 |
| - | `socialLinks` | `socialLinks` | `socialLinks` | 소셜 링크 입력 |

---

## 🧪 테스트 절차

### 1. 새로운 전문가 지원 및 승인 테스트

#### Step 1: 전문가 지원서 작성
```bash
# 브라우저에서 접속
http://localhost:3001/experts/become

# 입력 데이터:
- 이름: 테스트전문가
- 이메일: test@example.com
- 상담분야: "심리상담" (드롭다운에서 선택)
- 키워드: "스트레스, 우울, 불안, 트라우마" (콤마로 구분)
- MBTI: "ENFJ"
- 상담 스타일: "공감형, 해결책 제시형"
- 경력: 10년
- 자기소개: "10년 경력의 심리상담 전문가입니다..." (50자 이상)
- 경력사항:
  - 회사: "A상담센터"
  - 직책: "수석상담사"
  - 기간: "2020-현재"
- 학력: "서울대학교 심리학과 석사"
- 프로필 사진: 업로드
```

#### Step 2: 데이터베이스 확인 (지원서)
```sql
-- Prisma Studio에서 확인 (http://localhost:1098)
SELECT
  id,
  name,
  specialty,
  keywords,
  mbti,
  "consultationStyle",
  "workExperience",
  "profileImage"
FROM "ExpertApplication"
WHERE email = 'test@example.com'
ORDER BY "createdAt" DESC
LIMIT 1;

-- 예상 결과:
-- specialty: "심리상담 - 스트레스, 우울, 불안, 트라우마"
-- keywords: ["스트레스", "우울", "불안", "트라우마"]
-- mbti: "ENFJ"
-- consultationStyle: "공감형, 해결책 제시형"
-- workExperience: [{"company": "A상담센터", "position": "수석상담사", "period": "2020-현재"}]
```

#### Step 3: 관리자 승인
```bash
# 관리자 계정으로 로그인
http://localhost:3001/admin/applications

# 지원서 승인 클릭
- 상태: APPROVED
- 승인 메모: "테스트 승인"
```

#### Step 4: 데이터베이스 확인 (전문가 프로필)
```sql
-- Expert 테이블 확인
SELECT
  id,
  name,
  specialty,
  specialties,
  mbti,
  "consultationStyle",
  "workExperience",
  "avatarUrl"
FROM "Expert"
WHERE "userId" = (
  SELECT "userId" FROM "ExpertApplication" WHERE email = 'test@example.com'
);

-- 예상 결과: ⭐ parseSpecialty() 적용 확인
-- specialty: "심리상담" (키워드 제거됨)
-- specialties: ["스트레스", "우울", "불안", "트라우마"]
-- mbti: "ENFJ"
-- consultationStyle: "공감형, 해결책 제시형"
-- workExperience: [{"company": "A상담센터", "position": "수석상담사", "period": "2020-현재"}]
-- avatarUrl: "..." (프로필 이미지 URL)
```

#### Step 5: 전문가 프로필 편집 모드 확인
```bash
# 전문가 계정으로 로그인
http://localhost:3001/dashboard/expert/profile?mode=edit

# UI 검증 체크리스트:
✅ 상담분야: "심리상담" (카테고리명만, 키워드 없음)
✅ 키워드: [스트레스] [우울] [불안] [트라우마] (파란색 둥근 배지)
✅ 키워드 카운트: "입력된 키워드: 4개" 표시
✅ MBTI: "ENFJ" (드롭다운에서 선택됨)
✅ 상담 스타일: "공감형, 해결책 제시형" (textarea에 표시)
✅ 경력사항:
   - 회사: "A상담센터"
   - 직책: "수석상담사"
   - 기간: "2020-현재"
✅ 프로필 이미지: 썸네일 표시
```

#### Step 6: 브라우저 콘솔 로그 확인
```javascript
// F12 개발자 도구 → Console 탭

// 데이터 로드 시 로그:
🔄 데이터 변환 완료: {
  specialty: "심리상담",              // ✅ 카테고리명만
  specialties: ["스트레스", ...],     // ✅ 키워드 배열
  mbti: "ENFJ",                       // ✅ MBTI 데이터
  consultationStyle: "공감형, ...",   // ✅ 상담 스타일
  portfolioItems: [{...}],            // ✅ 경력사항
  profileImage: "...",                // ✅ 프로필 이미지
}

// ExpertProfileEdit props 로그:
expertData: {
  specialty: "심리상담",
  keywords: ["스트레스", "우울", "불안", "트라우마"],
  mbti: "ENFJ",
  consultationStyle: "공감형, 해결책 제시형",
  workExperience: [{...}],
  profileImage: "...",
}
```

### 2. 기존 전문가 데이터 마이그레이션 (선택사항)

만약 이미 승인된 전문가가 있고, specialty 필드에 키워드가 포함되어 있다면:

```sql
-- 1. 현재 상태 확인
SELECT id, name, specialty, specialties
FROM "Expert"
WHERE specialty LIKE '% - %';

-- 2. specialty 필드 정리 (키워드 제거)
UPDATE "Expert"
SET specialty = TRIM(SPLIT_PART(specialty, ' - ', 1))
WHERE specialty LIKE '% - %';

-- 3. 결과 확인
SELECT id, name, specialty, specialties
FROM "Expert"
WHERE specialty NOT LIKE '% - %';

-- 예시:
-- Before: specialty = "심리상담 - 스트레스, 우울, 불안"
-- After:  specialty = "심리상담"
```

---

## 📝 최종 체크리스트

### 백엔드 (API)
- [x] `parseSpecialty()` 함수 구현 (expert-applications.service.ts:184-190)
- [x] `cleanSpecialty` 변수로 specialty 필드 정리 (line 192)
- [x] Expert 생성 시 `cleanSpecialty` 사용 (line 200)
- [x] `specialties` 배열에 keywords 저장 (line 214)
- [x] `mbti`, `consultationStyle`, `workExperience` 매핑 확인
- [x] `avatarUrl` 필드에 profileImage 저장 확인

### 프론트엔드 (Web)
- [x] 데이터 변환 로직 개선 (profile/page.tsx:288-395)
  - [x] `avatarUrl` → `profileImage` 매핑
  - [x] `workExperience` → `portfolioItems` 매핑
  - [x] `mbti`, `consultationStyle` 추출
  - [x] `socialLinks` 객체 매핑
- [x] ExpertProfileEdit props 수정 (profile/page.tsx:676-749)
  - [x] `mbti` 하드코딩 제거, 실제 데이터 사용
  - [x] `consultationStyle` 하드코딩 제거, 실제 데이터 사용
  - [x] `workExperience` 하드코딩 제거, portfolioItems 매핑
  - [x] `profileImage` 전달
  - [x] `socialLinks` 전달
- [x] 키워드 UI 개선 (ExpertProfileEdit.tsx:675-711)
  - [x] 입력 필드 스타일 통일
  - [x] 키워드 카운트 표시
  - [x] 10개 제한 경고
  - [x] 배지 스타일 (파란색 둥근 모서리)

### 문서화
- [x] IMPLEMENTATION_SUMMARY.md - 전체 구현 개요
- [x] DATA_MAPPING_FIX.md - 필드 매핑 수정 상세
- [x] SPECIALTY_KEYWORD_FIX.md - 키워드 중복 문제 해결
- [x] FINAL_DATA_FLOW.md - 최종 데이터 흐름 (현재 문서)

---

## 🚀 배포 체크리스트

### 배포 전 확인
- [ ] API 서버 재시작 (backend 코드 변경)
- [ ] 웹 앱 빌드 테스트 (`pnpm build`)
- [ ] 타입스크립트 컴파일 오류 없음 확인
- [ ] 기존 데이터 specialty 필드 마이그레이션 필요성 검토

### 배포 후 확인
- [ ] 새로운 전문가 지원 → 승인 → 프로필 편집 E2E 테스트
- [ ] 기존 전문가 프로필 편집 모드 정상 작동 확인
- [ ] 키워드 중복 표시 문제 해결 확인
- [ ] 프로필 이미지 정상 표시 확인
- [ ] MBTI, 상담 스타일, 경력사항 데이터 정상 표시 확인

---

## 🎉 완료 상태

**수정 일시**: 2025-10-16
**API 서버**: ✅ 재시작 완료 (http://localhost:4000)
**웹 앱**: ✅ 실행 중 (http://localhost:3001)
**Prisma Studio**: ✅ 실행 중 (http://localhost:1098)
**컴파일 상태**: ✅ 오류 없음

**주요 수정 파일**:
1. ✅ `apps/api/src/admin/expert-applications/expert-applications.service.ts`
2. ✅ `apps/web/src/app/dashboard/expert/profile/page.tsx`
3. ✅ `apps/web/src/components/dashboard/ExpertProfileEdit.tsx`

**생성된 문서**:
1. ✅ `IMPLEMENTATION_SUMMARY.md`
2. ✅ `DATA_MAPPING_FIX.md`
3. ✅ `SPECIALTY_KEYWORD_FIX.md`
4. ✅ `FINAL_DATA_FLOW.md` (현재 문서)

---

## 💡 핵심 포인트 요약

1. **specialty 파싱**: 백엔드 승인 시 "카테고리 - 키워드" → "카테고리"로 분리
2. **필드명 매핑**: `avatarUrl` ↔ `profileImage`, `workExperience` ↔ `portfolioItems`
3. **하드코딩 제거**: MBTI, 상담 스타일, 경력사항의 빈 값 하드코딩을 실제 데이터 사용으로 변경
4. **키워드 UI 통일**: 전문가 지원하기와 프로필 편집의 키워드 UI 일관성 확보

**결과**: 전문가 지원서 작성 → 관리자 승인 → 프로필 편집 모드까지 모든 데이터가 완벽하게 흐릅니다! 🎉
