# 우선순위 1: 데이터베이스 인덱스 추가 분석

## 📋 개요

**목적**: ExpertApplication 테이블에 `(userId, createdAt)` 복합 인덱스 추가
**영향도**: ⭐⭐⭐⭐⭐ (매우 높음)
**위험도**: ⭐ (매우 낮음)
**예상 소요시간**: 5분

---

## 🎯 해결하려는 문제

### 문제 쿼리
```typescript
// auth.service.ts:281-284
const expertApplication = await this.prisma.expertApplication.findFirst({
  where: { userId },
  orderBy: { createdAt: 'desc' }
})
```

### 현재 인덱스 상태
```prisma
model ExpertApplication {
  // ...
  @@index([userId, status])      // Line 286
  @@index([status, createdAt])   // Line 287
}
```

### 문제 원인
1. `userId`로 필터링 → `(userId, status)` 인덱스 사용
2. `createdAt`으로 정렬 필요 → **인덱스에 없음**
3. MySQL이 메모리에서 정렬 시도
4. `sort_buffer_size` = 0.25 MB로 부족
5. **MySQL Error 1038**: "Out of sort memory"

---

## 🔧 수정 방안

### 파일: `apps/api/prisma/schema.prisma`

**위치**: Line 288 (인덱스 섹션)

**변경 전**:
```prisma
model ExpertApplication {
  // ... 필드들 ...

  @@index([userId, status])
  @@index([status, createdAt])
}
```

**변경 후**:
```prisma
model ExpertApplication {
  // ... 필드들 ...

  @@index([userId, status])
  @@index([status, createdAt])
  @@index([userId, createdAt])  // ✅ 추가!
}
```

---

## 📊 영향 분석

### 긍정적 영향

1. **성능 대폭 향상**
   - `findFirst({ where: { userId }, orderBy: { createdAt: 'desc' }})` 쿼리가 즉시 실행
   - 메모리 정렬 불필요 → sort_buffer_size 무관
   - 쿼리 속도: **100ms → 1ms 이하**로 개선 예상

2. **MySQL Error 1038 완전 해결**
   - 정렬 작업이 인덱스로 처리됨
   - "Out of sort memory" 에러 발생 안 함

3. **로그인 안정성 향상**
   - `/auth/me` 엔드포인트 안정화
   - 사용자 경험 개선

### 부정적 영향

1. **디스크 공간 증가**
   - 인덱스 크기 추가: 약 **16 bytes × 레코드 수**
   - 현재 2건 → **32 bytes** (무시할 수준)
   - 1000건 가정 → **16 KB** (여전히 작음)

2. **INSERT/UPDATE 성능**
   - 인덱스 유지 오버헤드 발생
   - ExpertApplication은 자주 변경되지 않음 → **영향 미미**
   - 예상 INSERT 시간 증가: **< 1ms**

3. **마이그레이션 시간**
   - 기존 레코드에 인덱스 생성 필요
   - 현재 2건 → **즉시 완료** (1초 이내)

### 종합 평가
- **이득**: 매우 큼 (성능 100배 향상)
- **비용**: 거의 없음 (디스크 32 bytes, INSERT 1ms 증가)
- **결론**: **즉시 적용 권장** ⭐⭐⭐⭐⭐

---

## 🚀 적용 절차

### 1단계: 스키마 수정
```bash
# schema.prisma 파일 수정
# Line 288에 추가: @@index([userId, createdAt])
```

### 2단계: 마이그레이션 생성
```bash
cd apps/api
npx prisma migrate dev --name add_expert_application_user_created_index
```

**예상 SQL**:
```sql
CREATE INDEX `ExpertApplication_userId_createdAt_idx`
ON `ExpertApplication`(`userId`, `createdAt`);
```

### 3단계: 마이그레이션 적용
```bash
# 개발 환경 (자동 적용됨)
npx prisma migrate dev

# 프로덕션 환경
npx prisma migrate deploy
```

### 4단계: 인덱스 확인
```sql
SHOW INDEX FROM ExpertApplication;
```

**예상 결과**:
```
Key_name                                | Column_name
----------------------------------------|-------------
ExpertApplication_userId_status_idx     | userId, status
ExpertApplication_status_createdAt_idx  | status, createdAt
ExpertApplication_userId_createdAt_idx  | userId, createdAt  ← 새로 추가됨
```

---

## ✅ 검증 방법

### 쿼리 성능 테스트

**테스트 스크립트** (`scripts/test-index-performance.ts`):
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testQueryPerformance() {
  const userId = 152;

  console.log('🧪 쿼리 성능 테스트 시작...\n');

  // 10회 반복 테스트
  const times: number[] = [];
  for (let i = 0; i < 10; i++) {
    const start = Date.now();

    await prisma.expertApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const end = Date.now();
    times.push(end - start);
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  console.log('📊 결과:');
  console.log(`  평균 실행 시간: ${avgTime.toFixed(2)}ms`);
  console.log(`  최소: ${minTime}ms`);
  console.log(`  최대: ${maxTime}ms`);
  console.log(`\n✅ ${avgTime < 5 ? '성공! 빠른 쿼리 속도' : '⚠️ 여전히 느림 (5ms 이상)'}`);

  await prisma.$disconnect();
}

testQueryPerformance();
```

**실행**:
```bash
npx tsx scripts/test-index-performance.ts
```

**성공 기준**:
- 평균 실행 시간 < 5ms
- "Out of sort memory" 에러 발생 안 함

### MySQL EXPLAIN 분석

```sql
EXPLAIN SELECT * FROM `ExpertApplication`
WHERE `userId` = 152
ORDER BY `createdAt` DESC
LIMIT 1;
```

**인덱스 적용 전** (문제):
```
type: ALL
possible_keys: ExpertApplication_userId_status_idx
key: ExpertApplication_userId_status_idx
Extra: Using where; Using filesort  ← 문제! (메모리 정렬)
```

**인덱스 적용 후** (해결):
```
type: ref
possible_keys: ExpertApplication_userId_createdAt_idx
key: ExpertApplication_userId_createdAt_idx
Extra: Using index  ← 해결! (인덱스만 사용)
```

---

## 🔄 롤백 방법

### 인덱스 제거 (필요시)

```sql
DROP INDEX `ExpertApplication_userId_createdAt_idx`
ON `ExpertApplication`;
```

또는 Prisma 마이그레이션:
```bash
# 이전 마이그레이션으로 롤백
npx prisma migrate resolve --rolled-back <migration_name>
```

---

## 📝 주의사항

### 적용 전 확인사항
- ✅ 데이터베이스 백업 (안전장치)
- ✅ 현재 ExpertApplication 레코드 수 확인
- ✅ 마이그레이션 로그 모니터링

### 적용 후 모니터링
- ✅ MySQL 슬로우 쿼리 로그 확인
- ✅ `/auth/me` 엔드포인트 응답 시간 모니터링
- ✅ 사용자 152 로그인 테스트

---

## 🎯 결론

**우선순위 1로 즉시 적용 권장**

**이유**:
1. ⭐ 가장 근본적인 해결책
2. ⭐ 부작용 거의 없음 (디스크 32 bytes 증가)
3. ⭐ 성능 100배 향상 예상
4. ⭐ 다른 수정사항 효과 극대화
5. ⭐ 5분 내 완료 가능

**다음 단계**: 우선순위 2 (백엔드 에러 처리) 진행
