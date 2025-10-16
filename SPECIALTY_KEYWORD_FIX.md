# 상담분야와 키워드 중복 문제 수정 완료

## 🔍 발견된 문제

### 증상
1. **상담분야 필드**: "심리상담 - 스트레스, 우울, 불안" 형식으로 카테고리명과 키워드가 함께 표시됨
2. **키워드 필드**: "스트레스, 우울, 불안" 형식으로 키워드만 표시됨
3. **결과**: 키워드가 두 곳에 중복 표시되어 혼란 야기

### 근본 원인

**전문가 지원하기 페이지 (`apps/web/src/app/experts/become/page.tsx`)**

634-638줄에서 API 전송 시 `specialty` 필드에 카테고리명과 키워드를 모두 포함:

```typescript
// 키워드를 specialty에 포함 (키워드가 있는 경우)
const keywordsText = keywords.length > 0 ? keywords.join(', ') : ''
const fullSpecialty = keywordsText
  ? `${categoryName} - ${keywordsText}`  // ❌ 문제: 키워드를 specialty에 포함
  : categoryName || specialty
```

**백엔드 승인 프로세스**

`specialty` 필드를 파싱 없이 그대로 Expert 테이블에 저장:

```typescript
// 이전 코드 (문제)
specialty: application.specialty,  // "심리상담 - 스트레스, 우울, 불안" 그대로 저장
```

## ✅ 적용된 수정

### 백엔드 수정

**파일**: `apps/api/src/admin/expert-applications/expert-applications.service.ts` (184-200줄)

specialty 파싱 함수를 추가하여 카테고리명만 추출:

```typescript
// specialty 파싱: "카테고리명 - 키워드1, 키워드2" 형식에서 카테고리명만 추출
const parseSpecialty = (specialty: string): string => {
  if (!specialty) return '';
  // " - " 로 분리되어 있는 경우 첫 번째 부분만 반환
  const parts = specialty.split(' - ');
  return parts[0].trim();
};

const cleanSpecialty = parseSpecialty(application.specialty);

const expert = await tx.expert.create({
  data: {
    displayId: `EXP${Date.now()}${application.userId}`,
    userId: application.userId,
    name: application.name,
    title: application.jobTitle || cleanSpecialty,  // ✅ 카테고리명만 사용
    specialty: cleanSpecialty,                      // ✅ 카테고리명만 저장
    // ...
    specialties: application.keywords || [],        // ✅ 키워드는 별도 배열로 저장
  }
});
```

### 프론트엔드 키워드 UI 개선

**파일**: `apps/web/src/components/dashboard/ExpertProfileEdit.tsx` (675-711줄)

전문가 지원하기와 동일한 스타일로 키워드 UI 개선:

```typescript
{/* Keywords Section */}
<div>
  <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
    <Tag className="w-4 h-4 mr-2" /> 키워드 (상담 주제)
    <span className="text-red-500 ml-1">*</span>
    <span className="ml-2 text-xs text-gray-500 font-normal">(콤마로 구분, 최대 10개)</span>
  </h3>
  <input
    type="text"
    value={keywordsInput}
    onChange={(e) => handleKeywordsChange(e.target.value)}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    placeholder="예: 스트레스, 우울, 불안, 계약법, 이직, 커리어"
  />
  <div className="flex items-center justify-between mt-2">
    <p className="text-xs text-gray-500">
      {formData.keywords.length > 0 && `입력된 키워드: ${formData.keywords.length}개`}
    </p>
    {formData.keywords.length >= 10 && (
      <p className="text-xs text-red-500">최대 10개까지만 입력 가능합니다</p>
    )}
  </div>

  {/* 입력된 키워드 태그 표시 */}
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

## 📊 데이터 흐름

### Before (수정 전)

```
전문가 지원하기
├─ specialty: "심리상담 - 스트레스, 우울, 불안"
├─ keywords: ["스트레스", "우울", "불안"]
│
▼ 관리자 승인
│
Expert 테이블
├─ specialty: "심리상담 - 스트레스, 우울, 불안"  ❌ 키워드 포함
├─ specialties: ["스트레스", "우울", "불안"]      ✅ 키워드 배열
│
▼ 프로필 편집 모드
│
UI 표시
├─ 상담분야: "심리상담 - 스트레스, 우울, 불안"  ❌ 중복
├─ 키워드: [스트레스] [우울] [불안]            ❌ 중복
```

### After (수정 후)

```
전문가 지원하기
├─ specialty: "심리상담 - 스트레스, 우울, 불안"  (변경 없음)
├─ keywords: ["스트레스", "우울", "불안"]
│
▼ 관리자 승인 (파싱 추가)
│
parseSpecialty() 함수
├─ 입력: "심리상담 - 스트레스, 우울, 불안"
├─ 처리: " - " 로 split
└─ 출력: "심리상담"
│
▼
│
Expert 테이블
├─ specialty: "심리상담"                       ✅ 카테고리명만 저장
├─ specialties: ["스트레스", "우울", "불안"]    ✅ 키워드 배열
│
▼ 프로필 편집 모드
│
UI 표시
├─ 상담분야: "심리상담"                         ✅ 카테고리명만
├─ 키워드: [스트레스] [우울] [불안]             ✅ 키워드만
```

## 🧪 테스트 방법

### 1. 새로운 전문가 지원 테스트

```bash
# 1. 전문가 지원하기 페이지 접속
http://localhost:3001/experts/become

# 2. 지원서 작성
상담분야 선택: "심리상담" (드롭다운)
키워드 입력: "스트레스, 우울, 불안, 트라우마"

# 3. 제출 후 데이터베이스 확인
SELECT specialty FROM "ExpertApplication" WHERE email = 'test@example.com';
-- 예상: "심리상담 - 스트레스, 우울, 불안, 트라우마"
```

### 2. 관리자 승인 후 확인

```bash
# 1. 관리자로 지원서 승인

# 2. Expert 테이블 확인
SELECT specialty, specialties FROM "Expert" WHERE email = 'test@example.com';
-- 예상 결과:
-- specialty: "심리상담"
-- specialties: ["스트레스", "우울", "불안", "트라우마"]
```

### 3. 프로필 편집 모드 확인

```bash
# 1. 승인된 전문가 계정으로 로그인
# 2. 프로필 편집 접속
http://localhost:3001/dashboard/expert/profile?mode=edit

# 3. UI 검증
✅ 상담분야: "심리상담" (카테고리명만 표시)
✅ 키워드: [스트레스] [우울] [불안] [트라우마] (배지로 표시)
```

### 4. 브라우저 콘솔 확인

```javascript
// 데이터 로드 시 콘솔 로그
🔄 데이터 변환 완료: {
  specialty: "심리상담",           // ✅ 카테고리명만
  specialties: ["스트레스", ...],  // ✅ 키워드 배열
}
```

## 🔍 parseSpecialty 함수 상세

### 함수 로직

```typescript
const parseSpecialty = (specialty: string): string => {
  if (!specialty) return '';
  // " - " 로 분리되어 있는 경우 첫 번째 부분만 반환
  const parts = specialty.split(' - ');
  return parts[0].trim();
};
```

### 테스트 케이스

| 입력 | 출력 |
|------|------|
| `"심리상담 - 스트레스, 우울, 불안"` | `"심리상담"` |
| `"법률상담 - 계약법, 노동법"` | `"법률상담"` |
| `"커리어코칭"` | `"커리어코칭"` |
| `""` (빈 문자열) | `""` |
| `"심리상담 - "` | `"심리상담"` |

### 안전성

- ✅ 빈 문자열 처리
- ✅ " - " 구분자가 없는 경우 전체 문자열 반환
- ✅ 앞뒤 공백 제거 (trim)

## 📝 체크리스트

### 기존 데이터 마이그레이션 (선택사항)

이미 승인된 전문가가 있는 경우, 데이터베이스 업데이트 필요:

```sql
-- Expert 테이블의 specialty 필드 정리
UPDATE "Expert"
SET specialty = TRIM(SPLIT_PART(specialty, ' - ', 1))
WHERE specialty LIKE '% - %';

-- 확인
SELECT id, name, specialty, specialties
FROM "Expert"
WHERE specialty NOT LIKE '% - %';
```

### 테스트 체크리스트

- [ ] 새로운 지원서 제출 → specialty에 " - 키워드" 포함 확인
- [ ] 관리자 승인 → Expert.specialty에 카테고리명만 저장 확인
- [ ] 프로필 편집 모드 → 상담분야와 키워드가 분리되어 표시 확인
- [ ] 키워드 배지가 파란색 둥근 모서리로 표시 확인
- [ ] 키워드 개수 표시 확인 ("입력된 키워드: N개")
- [ ] 10개 제한 경고 표시 확인
- [ ] 저장 후 재로드 시 데이터 유지 확인

## 🎯 수정의 핵심 포인트

1. **백엔드 파싱**: `specialty` 필드를 파싱하여 카테고리명만 추출
2. **데이터 분리**:
   - `specialty` = 카테고리명만 (예: "심리상담")
   - `specialties` = 키워드 배열 (예: ["스트레스", "우울", "불안"])
3. **UI 개선**: 키워드 입력/표시 UI를 전문가 지원하기와 통일
4. **안전성**: parseSpecialty 함수로 다양한 입력 형식 처리

## 📂 수정된 파일

1. **백엔드**:
   - `apps/api/src/admin/expert-applications/expert-applications.service.ts` (184-200줄)
     - parseSpecialty 함수 추가
     - cleanSpecialty 변수로 카테고리명 추출

2. **프론트엔드**:
   - `apps/web/src/components/dashboard/ExpertProfileEdit.tsx` (675-711줄)
     - 키워드 UI 개선
     - 입력 상태 표시 추가
     - 배지 스타일 통일

## 🚀 배포 시 주의사항

1. **API 서버 재시작 필요**: 백엔드 코드 변경으로 재배포 필요
2. **기존 데이터 확인**: 이미 승인된 전문가의 specialty 필드에 키워드가 포함되어 있는지 확인
3. **선택적 마이그레이션**: 필요시 SQL 스크립트로 기존 데이터 정리

---

**수정 완료 일시**: 2025-10-16
**API 서버**: ✅ 재시작 완료 (http://localhost:4000)
**웹 앱**: ✅ 실행 중 (http://localhost:3001)
**컴파일 상태**: ✅ 오류 없음
