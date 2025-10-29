# AI Photo Studio 통합 - 이슈 및 해결방안

## 🔍 심층 분석 결과

**분석 일시**: 2025-10-29
**분석 범위**: 구현 계획 전체 검토 및 코드베이스 호환성 검증
**결론**: ⚠️ **조건부 진행 가능** (차단 이슈 수정 후 진행)

---

## 🚨 차단 이슈 (Critical - 반드시 수정 필요)

### 1. User.avatarUrl 필드 크기 부족

**문제**:
```prisma
// 현재 (apps/api/prisma/schema.prisma:17)
avatarUrl  String?   // VARCHAR(191) - 너무 작음!
```

**원인**:
- MySQL에서 `String?`는 기본적으로 `VARCHAR(191)`로 매핑됨
- Base64 인코딩된 이미지는 매우 큼:
  - 1MB 이미지 → 약 1.3MB base64 텍스트
  - 프로필 사진 (200KB 평균) → 약 270KB base64
- VARCHAR(191)는 최대 191바이트만 저장 가능

**영향**:
- 🔴 업로드된 이미지가 DB에 저장되지 않음
- 🔴 데이터 손실 발생
- 🔴 애플리케이션 에러 발생

**해결방안**:
```prisma
// 수정 (Expert 모델과 동일하게)
avatarUrl  String?  @db.Text  // TEXT (65,535 bytes) - base64 이미지 충분
```

**비교**:
- Expert 모델은 이미 `@db.Text` 사용 중 (line 69) ✅
- User 모델만 빠짐 ❌
- 일관성을 위해서도 수정 필요

**적용 방법**:
```bash
# 1. schema.prisma 수정
# 2. 마이그레이션 생성 및 적용
cd apps/api
npx prisma migrate dev --name fix_user_avatar_url_field
npx prisma generate
```

---

## ⚠️ 중요 이슈 (Important - 구현 전 해결 권장)

### 2. 백엔드 의존성 패키지 누락

**문제**:
```json
// apps/api/package.json - 없는 패키지들:
// - form-data (AI 서비스에 multipart 전송용)
// - @types/multer (TypeScript 타입)
```

**영향**:
- TypeScript 타입 에러 발생
- AI Photo Studio 서비스 호출 실패

**해결방안**:
```bash
cd apps/api
pnpm add form-data
pnpm add -D @types/multer
```

**참고**:
- `multer`는 `@nestjs/platform-express`에 포함되어 있어 별도 설치 불필요 ✅
- `axios`는 이미 설치되어 있음 ✅

---

### 3. 환경 변수 스키마 업데이트 필요

**문제**:
```typescript
// apps/api/src/config/env.schema.ts
// AI_PHOTO_STUDIO_URL이 없음
```

**영향**:
- 환경 변수 검증 실패
- 서버 시작 불가

**해결방안**:
```typescript
// apps/api/src/config/env.schema.ts에 추가
export const EnvSchema = z.object({
  // ... 기존 코드 ...

  // AI Photo Studio Configuration
  AI_PHOTO_STUDIO_URL: z.string().url().optional(),
  AI_PHOTO_STUDIO_TIMEOUT: z.coerce.number().int().positive().default(60000),
})
```

---

## 📝 일반 이슈 (Moderate - 구현 중 처리 가능)

### 4. AiPhotoStudioModule 등록

**작업**:
```typescript
// apps/api/src/app.module.ts
imports: [
  // ... 기존 imports ...
  AiPhotoStudioModule,  // 추가
]
```

---

### 5. UsersModule 의존성 추가

**작업**:
```typescript
// apps/api/src/users/users.module.ts
@Module({
  imports: [
    AuthModule,
    CreditsModule,
    AiPhotoStudioModule,  // 추가
  ],
  // ...
})
```

---

### 6. Rate Limiting 설정 (선택사항)

**권장사항**:
```bash
# @nestjs/throttler 설치
cd apps/api
pnpm add @nestjs/throttler
```

```typescript
// app.module.ts
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 3600,  // 1시간
      limit: 5,    // 5회 제한
    }),
    // ...
  ],
})
```

```typescript
// users.controller.ts
import { Throttle } from '@nestjs/throttler';

@Throttle(5, 3600)  // 시간당 5회
@Post('profile-photo')
```

---

## ✅ 긍정적 발견사항

### 코드베이스 호환성
1. ✅ **ConfigModule 이미 설정됨**: Global로 구성되어 바로 사용 가능
2. ✅ **axios 설치됨**: v1.11.0 사용 중
3. ✅ **엔드포인트 충돌 없음**: profile-photo 엔드포인트 미사용
4. ✅ **UsersModule 존재**: 이미 잘 구조화되어 있음
5. ✅ **Expert.avatarUrl 올바름**: @db.Text로 이미 설정됨
6. ✅ **multer 충돌 없음**: 프로젝트 내 기존 사용 없음

### 아키텍처 일관성
- NestJS 모듈 패턴 잘 따르고 있음
- Prisma 스키마 구조 명확함
- 환경 변수 검증 시스템 존재

---

## 🔧 전체 수정 체크리스트

### Phase 0: 사전 수정 (필수)
- [ ] **1. User.avatarUrl 필드 타입 변경**
  ```bash
  # schema.prisma 수정 후
  cd apps/api
  npx prisma migrate dev --name fix_user_avatar_url_field
  npx prisma generate
  ```

- [ ] **2. 백엔드 의존성 설치**
  ```bash
  cd apps/api
  pnpm add form-data
  pnpm add -D @types/multer
  ```

- [ ] **3. 환경 변수 스키마 업데이트**
  - `apps/api/src/config/env.schema.ts` 수정
  - AI_PHOTO_STUDIO_URL, AI_PHOTO_STUDIO_TIMEOUT 추가

- [ ] **4. 환경 변수 파일 업데이트**
  ```bash
  # apps/api/.env에 추가
  AI_PHOTO_STUDIO_URL=https://your-service.run.app
  AI_PHOTO_STUDIO_TIMEOUT=60000
  ```

### Phase 1: 백엔드 구현
- [ ] **5. AiPhotoStudioModule 생성**
  - `apps/api/src/ai-photo-studio/` 디렉토리 생성
  - Service, Module 파일 작성

- [ ] **6. UsersController 엔드포인트 추가**
  - POST /users/profile-photo 구현
  - File validation 추가

- [ ] **7. UsersService 메서드 추가**
  - uploadProfilePhoto 구현
  - AI 변환 로직 통합

- [ ] **8. 모듈 등록**
  - app.module.ts에 AiPhotoStudioModule 추가
  - users.module.ts에 AiPhotoStudioModule import

### Phase 2: 프론트엔드 구현
- [ ] **9. PhotoUpload 컴포넌트 생성**
  - `apps/web/src/components/profile/PhotoUpload.tsx`

- [ ] **10. Profile 페이지 통합**
  - 기존 handleImageUpload 제거
  - PhotoUpload 컴포넌트 통합

### Phase 3: 테스트
- [ ] **11. 로컬 테스트**
  - 일반 업로드 테스트
  - AI 변환 업로드 테스트
  - 에러 케이스 테스트

- [ ] **12. AI Photo Studio 배포**
  - Cloud Run 배포
  - Health check 확인

---

## 🎯 구현 순서 (수정된)

### Step 1: 차단 이슈 해결 (30분)
```bash
# 1. Schema 수정
# apps/api/prisma/schema.prisma
# avatarUrl String? → avatarUrl String? @db.Text

# 2. 마이그레이션
cd apps/api
npx prisma migrate dev --name fix_user_avatar_url_field
npx prisma generate

# 3. 의존성 설치
pnpm add form-data
pnpm add -D @types/multer

# 4. 환경 변수 업데이트
# env.schema.ts에 AI_PHOTO_STUDIO_URL 추가
# .env에 값 추가

# 5. 서버 재시작 및 확인
pnpm dev
```

### Step 2: 백엔드 구현 (3-4시간)
- 계획서대로 진행

### Step 3: 프론트엔드 구현 (2-3시간)
- 계획서대로 진행

### Step 4: 테스트 및 배포 (2-3시간)
- 계획서대로 진행

---

## 📊 위험도 평가

### 차단 이슈
| 이슈 | 심각도 | 수정 난이도 | 예상 시간 |
|------|--------|-------------|-----------|
| User.avatarUrl 크기 | 🔴 Critical | 낮음 | 5분 |
| 의존성 누락 | 🔴 Critical | 낮음 | 2분 |
| 환경 변수 스키마 | 🟡 Important | 낮음 | 5분 |

### 구현 위험
| 영역 | 위험도 | 완화 방안 |
|------|--------|-----------|
| Database | 낮음 | 스키마 수정 후 안전 |
| Backend API | 낮음 | 모듈 패턴 명확함 |
| Frontend | 낮음 | 독립 컴포넌트 |
| AI Service | 중간 | Timeout 및 에러 처리 |
| Integration | 낮음 | 충돌 없음 |

---

## 💡 권장사항

### 즉시 수정 (Implementation Blockers)
1. ✅ User.avatarUrl → @db.Text 변경
2. ✅ 의존성 패키지 설치
3. ✅ 환경 변수 스키마 업데이트

### 구현 중 처리
4. Rate limiting 추가 (보안)
5. 에러 로깅 강화
6. AI 변환 타임아웃 모니터링

### 프로덕션 전 필수
7. AI Photo Studio Cloud Run 배포
8. Load testing
9. 백업 및 롤백 계획

---

## 🚦 최종 판정

### ✅ 구현 진행 가능 (GO)

**조건**:
- ✅ Step 1 (차단 이슈 해결) 완료 후
- ✅ 예상 시간: 30분 이내 수정 가능
- ✅ 위험도: 낮음 (수정 사항 단순함)

**근거**:
1. 차단 이슈는 모두 간단한 수정으로 해결 가능
2. 코드베이스는 통합에 매우 적합함
3. 아키텍처 충돌 없음
4. 의존성 문제 없음

---

## 📋 수정 스크립트

아래 스크립트를 순서대로 실행하면 모든 차단 이슈가 해결됩니다:

```bash
#!/bin/bash

echo "🔧 AI Photo Studio 통합 사전 수정 시작..."

# 1. Schema 수정 (수동)
echo "📝 1. schema.prisma 파일을 수정해주세요:"
echo "   Line 17: avatarUrl String? → avatarUrl String? @db.Text"
read -p "수정 완료하면 Enter를 누르세요..."

# 2. 마이그레이션
echo "🗄️  2. 데이터베이스 마이그레이션 중..."
cd apps/api
npx prisma migrate dev --name fix_user_avatar_url_field
npx prisma generate

# 3. 의존성 설치
echo "📦 3. 백엔드 의존성 설치 중..."
pnpm add form-data
pnpm add -D @types/multer

# 4. 환경 변수 스키마 수정 (수동)
echo "📝 4. env.schema.ts 파일을 수정해주세요:"
echo "   AI_PHOTO_STUDIO_URL: z.string().url().optional(),"
echo "   AI_PHOTO_STUDIO_TIMEOUT: z.coerce.number().int().positive().default(60000),"
read -p "수정 완료하면 Enter를 누르세요..."

# 5. 환경 변수 파일 확인
echo "📝 5. .env 파일에 다음 추가:"
echo "   AI_PHOTO_STUDIO_URL=https://your-service.run.app"
echo "   AI_PHOTO_STUDIO_TIMEOUT=60000"
read -p "추가 완료하면 Enter를 누르세요..."

echo "✅ 모든 사전 수정 완료!"
echo "🚀 이제 구현을 시작할 수 있습니다."
```

---

## 🎉 결론

**구현 진행 가능합니다!**

차단 이슈 3개는 모두 30분 이내에 간단히 수정 가능하며, 그 외에는 코드베이스가 통합에 매우 적합한 상태입니다.

계획서대로 구현을 진행하되, 위의 사전 수정사항을 먼저 적용해주세요.

**다음 단계**: Step 1 (차단 이슈 해결) → 백엔드 구현 → 프론트엔드 구현 → 테스트 → 배포
