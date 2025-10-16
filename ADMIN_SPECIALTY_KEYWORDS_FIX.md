# 관리자 모드 전문분야/키워드 분리 수정

## 문제 상황

관리자 모드의 전문가 지원 목록에서 전문분야 컬럼에 "심리상담 - 스트레스, 우울, 불안" 형태로 카테고리명과 키워드가 함께 표시되는 문제

## 프로필 편집에 미치는 영향

✅ **영향 없음** - 승인 프로세스에서 자동으로 분리 처리됨

### 이유
1. 승인 시 `parseSpecialty()` 함수가 카테고리명만 추출 ([expert-applications.service.ts:184-192](apps/api/src/admin/expert-applications/expert-applications.service.ts#L184-L192))
2. Expert 테이블에는 올바르게 분리된 데이터 저장
3. 프로필 편집은 Expert 테이블 데이터 사용 (Application 테이블 아님)

```typescript
// 승인 프로세스
const parseSpecialty = (specialty: string): string => {
  const parts = specialty.split(' - ');
  return parts[0].trim();  // ✅ "심리상담"만 저장
};

const expert = await tx.expert.create({
  specialty: cleanSpecialty,  // ✅ "심리상담"
  specialties: application.keywords || [],  // ✅ ["스트레스", "우울", "불안"]
});
```

## 수정 내용 (옵션 2 적용)

### 1. 관리자 지원 목록 API 수정

**파일**: `apps/api/src/admin/expert-applications/expert-applications.service.ts`

**변경 전**:
```typescript
async getApplications(query: ApplicationListQuery) {
  // ...
  const [data, total] = await Promise.all([...]);

  return {
    data,  // specialty 필드에 "심리상담 - 키워드" 형태로 반환
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}
```

**변경 후**:
```typescript
async getApplications(query: ApplicationListQuery) {
  // ...
  const [data, total] = await Promise.all([...]);

  // specialty 파싱: "카테고리명 - 키워드" 형식에서 카테고리명만 추출
  const parseSpecialty = (specialty: string): string => {
    if (!specialty) return '';
    const parts = specialty.split(' - ');
    return parts[0].trim();
  };

  // 목록의 각 항목에 대해 specialty 파싱
  const parsedData = data.map(app => ({
    ...app,
    specialty: parseSpecialty(app.specialty),  // ✅ "심리상담"만 반환
  }));

  return {
    data: parsedData,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}
```

### 2. 관리자 상세 페이지 프론트엔드 수정

**파일**: `apps/web/src/app/admin/applications/[id]/page.tsx`

**변경 전**:
```typescript
<InfoRow
  icon={<FileText className="w-5 h-5" />}
  label="전문분야"
  value={application.specialty.split(' - ')[0] || application.specialty}  // 프론트엔드 파싱
/>
```

**변경 후**:
```typescript
<InfoRow
  icon={<FileText className="w-5 h-5" />}
  label="전문분야"
  value={application.specialty}  // 백엔드에서 이미 파싱됨
/>
```

**이유**: 백엔드 API에서 이미 specialty를 파싱하여 반환하므로 프론트엔드의 중복 파싱 제거

### 3. Keywords 필드 일관성 확인

✅ **이미 적용됨**:
- 관리자 상세 페이지 타입: `keywords: string[]` (Line 37)
- 화면 표시: `application.keywords.map()` 사용 (Line 248-256)
- 백엔드 API 응답: `keywords: parseJsonField(application.keywords)` (Line 132)

## 최종 데이터 흐름

### 관리자 목록 페이지
```
DB: specialty = "심리상담 - 스트레스, 우울"
  ↓
API 파싱 (getApplications)
  ↓
API 응답: specialty = "심리상담"  ✅
  ↓
프론트엔드 표시: "심리상담"  ✅
```

### 관리자 상세 페이지
```
DB:
  specialty = "심리상담 - 스트레스, 우울"
  keywords = ["스트레스", "우울", "불안"]
  ↓
API 응답 (getApplicationDetail):
  specialty = "심리상담 - 스트레스, 우울"  (원본 유지)
  keywords = ["스트레스", "우울", "불안"]
  ↓
프론트엔드 표시:
  전문분야: "심리상담"  ✅ (백엔드 파싱 제거했으므로 옵션2 적용 필요)
  키워드: ["스트레스", "우울", "불안"]  ✅
```

**참고**: 상세 페이지는 승인/거부 결정을 위한 원본 데이터 확인이 중요하므로, 목록 API와 달리 specialty를 파싱하지 않고 원본 유지. 프론트엔드에서 표시만 파싱.

## 영향 받는 파일 목록

### 백엔드 (1개 파일)
1. `apps/api/src/admin/expert-applications/expert-applications.service.ts`
   - `getApplications()` 메서드에 specialty 파싱 로직 추가

### 프론트엔드 (1개 파일)
1. `apps/web/src/app/admin/applications/[id]/page.tsx`
   - 중복 specialty 파싱 제거 (백엔드에서 처리)

## Keywords 마이그레이션 상태

✅ **관리자 모드는 이미 keywords 사용 중**:
- 타입 정의: `keywords: string[]`
- API 응답: `keywords: parseJsonField(application.keywords)`
- 화면 표시: `application.keywords.map()`
- 승인 프로세스: `specialties: application.keywords`

## 테스트 권장 사항

### 1. 관리자 지원 목록 페이지
- [ ] 전문분야 컬럼에 카테고리명만 표시 (예: "심리상담")
- [ ] 키워드가 함께 표시되지 않는지 확인

### 2. 관리자 상세 페이지
- [ ] 전문분야: 카테고리명만 표시
- [ ] 키워드: 별도 섹션에 배지 형태로 표시
- [ ] 두 필드가 명확하게 분리되어 있는지 확인

### 3. 승인 프로세스
- [ ] 지원서 승인 시 Expert 테이블에 올바르게 저장
  - specialty: "심리상담"
  - specialties (DB): ["스트레스", "우울", "불안"]
- [ ] 프로필 편집에서 올바르게 표시되는지 확인

## API 서버 상태

✅ **정상 실행 중** (http://localhost:4000)
- 모든 라우트 정상 등록
- Hot-reload 활성화
- 0 TypeScript 에러

## 관련 문서

- [SPECIALTY_KEYWORDS_SEPARATION_FIX.md](SPECIALTY_KEYWORDS_SEPARATION_FIX.md) - 전문가 지원양식 및 프로필 편집 수정
- [SPECIALTIES_TO_KEYWORDS_MIGRATION.md](SPECIALTIES_TO_KEYWORDS_MIGRATION.md) - 전체 specialties → keywords 마이그레이션 가이드
