# AI 채팅상담 토큰 관리 시스템 구현 완료 보고서

**작성일**: 2025-10-21
**프로젝트**: Consutl-On-re
**구현 범위**: Phase 1 (필수) + Phase 2 (중요) + Phase 3 (선택)

---

## 📊 구현 개요

### 핵심 정책
- **무료 토큰**: 매월 100,000 토큰 제공 (자동 리셋)
- **구매 토큰**: 영구 보관, 우선 소진
- **대화 목록**: 현재 유지 (삭제 안 함)
- **사용 제한**: Soft Limit 방식 (105% 차단, 90% 경고)

---

## ✅ 구현 완료 항목

### Phase 1: 핵심 UX 개선 (필수)

#### 1. Soft Limit 토큰 제한 로직
**파일**: `apps/api/src/chat/chat.service.ts`

**구현 내용**:
```typescript
// 토큰 체크 로직
const usage = await this.aiUsageService.getUsageState(userId);
const totalAvailable = 100000 + usage.purchasedTokens;
const usagePercent = (usage.usedTokens / totalAvailable) * 100;

// Hard limit: 105% 초과 시 차단
if (usagePercent >= 105) {
  throw new Error(JSON.stringify({
    code: 'TOKEN_EXHAUSTED',
    message: '토큰이 모두 소진되었습니다...',
    remainingTokens,
    recommendedAction: 'PURCHASE_TOKENS',
  }));
}

// Soft warning: 90~105% 사용 중
if (usagePercent >= 90 && usagePercent < 105) {
  tokenWarning = {
    level: usagePercent >= 95 ? 'CRITICAL' : 'WARNING',
    message: `토큰이 ${100 - usagePercent}% 남았습니다.`,
    remainingTokens,
    estimatedTurns,
  };
}
```

**주요 특징**:
- ✅ 105% 이상 사용 시 Hard limit 차단
- ✅ 90~95%: WARNING 레벨 경고
- ✅ 95~105%: CRITICAL 레벨 경고
- ✅ 응답에 warning 정보 포함
- ✅ 구매 페이지 URL 제공

---

#### 2. 프론트엔드 경고 UI
**파일**: `apps/web/src/components/dashboard/user/AIUsageCard.tsx`

**구현 내용**:
- **90~95% 사용**: 주황색 경고 배너
- **95~105% 사용**: 빨간색 긴급 경고 배너
- **105% 이상**: 빨간색 차단 메시지 + AI 채팅 버튼 비활성화

**UI 상태**:
```
80% 미만: 정상 (초록색)
80~90%: 토큰 추가 구매 버튼 표시
90~95%: 주황색 경고 배너 + 구매 버튼
95~105%: 빨간색 긴급 경고 + 구매 버튼
105% 이상: 빨간색 차단 메시지 + AI 채팅 버튼 비활성화
```

---

### Phase 2: 운영 효율화 (중요)

#### 3. 토큰 부족 알림 배치 시스템
**파일**: `apps/api/src/ai-usage/token-notification.scheduler.ts`

**구현 내용**:
```typescript
@Cron(CronExpression.EVERY_HOUR)
async checkTokenThresholds() {
  // 1. 모든 사용자 토큰 사용률 체크
  // 2. 90% 이상 사용자에게 알림
  // 3. 24시간 내 중복 알림 방지
}
```

**주요 특징**:
- ✅ 매시간 정각 실행
- ✅ 90% WARNING, 95% CRITICAL 알림
- ✅ 24시간 중복 방지
- ✅ Notification 테이블에 저장
- ✅ 구매 페이지 링크 포함

**활성화**:
- `apps/api/src/app.module.ts`에 `ScheduleModule.forRoot()` 추가
- `apps/api/src/ai-usage/ai-usage.module.ts`에 `TokenNotificationScheduler` provider 추가

---

### Phase 3: 선택적 개선

#### 4. 관리자 토큰 통계 대시보드
**파일**:
- `apps/api/src/admin/token-stats/token-stats.service.ts`
- `apps/api/src/admin/token-stats/token-stats.controller.ts`
- `apps/api/src/admin/token-stats/token-stats.module.ts`

**엔드포인트**:
```
GET /admin/token-stats
→ 전체 토큰 사용 통계 (캐싱 10분)

GET /admin/token-stats/user/:userId
→ 특정 사용자 상세 내역

DELETE /admin/token-stats/cache
→ 캐시 수동 초기화
```

**통계 데이터**:
```typescript
{
  overview: {
    totalUsers: number,
    activeUsers: number,
    totalUsedTokens: number,
    totalPurchasedTokens: number,
    averageUsedTokens: number,
  },
  distribution: {
    under50: number,  // 0-50% 사용
    under80: number,  // 50-80% 사용
    under90: number,  // 80-90% 사용
    under95: number,  // 90-95% 사용
    over95: number,   // 95% 이상 사용
  },
  topUsers: Array<{
    userId: number,
    email: string,
    usedTokens: number,
    usagePercent: number,
    ...
  }>,
}
```

**성능 최적화**:
- ✅ Redis 캐싱 (10분)
- ✅ 상위 100명만 조회
- ✅ aggregate() 최적화
- ✅ AdminGuard 인증 필수

---

## 🔧 기술 스택

### Backend
- NestJS (Framework)
- Prisma (ORM)
- @nestjs/schedule (Cron)
- @nestjs/cache-manager (Caching)
- Redis (Cache Storage)

### Frontend
- Next.js
- React
- TanStack Query
- Tailwind CSS

---

## 📋 테스트 시나리오

### 1. 토큰 제한 테스트
```bash
# 테스트 사용자 생성 (90% 사용)
curl -X POST http://localhost:3000/api/ai-usage/test-usage \
  -H "Authorization: Bearer <token>" \
  -d '{"userId": 1, "usagePercent": 90}'

# AI 채팅 전송 (경고 확인)
curl -X POST http://localhost:3000/api/chat/send \
  -H "Authorization: Bearer <token>" \
  -d '{"message": "안녕하세요"}'

# 응답에 warning 필드 확인
{
  "content": "...",
  "warning": {
    "level": "WARNING",
    "message": "토큰이 10% 남았습니다.",
    "remainingTokens": 10000,
    "estimatedTurns": 11
  }
}
```

### 2. 알림 배치 테스트
```bash
# 크론 수동 실행 (개발 환경)
# apps/api/src/ai-usage/token-notification.scheduler.ts의
# @Cron(CronExpression.EVERY_HOUR)를 주석 처리하고
# 직접 메서드 호출

# 알림 확인
curl -X GET http://localhost:3000/api/notifications \
  -H "Authorization: Bearer <token>"
```

### 3. 관리자 통계 테스트
```bash
# 통계 조회
curl -X GET http://localhost:3000/api/admin/token-stats \
  -H "Authorization: Bearer <admin-token>"

# 사용자 상세
curl -X GET http://localhost:3000/api/admin/token-stats/user/1 \
  -H "Authorization: Bearer <admin-token>"

# 캐시 초기화
curl -X DELETE http://localhost:3000/api/admin/token-stats/cache \
  -H "Authorization: Bearer <admin-token>"
```

---

## ⚠️ 주의사항

### 1. 환경 변수 확인
```env
# Redis 설정 (캐싱용)
REDIS_HOST=localhost
REDIS_PORT=6379

# OpenAI API (AI 채팅용)
OPENAI_API_KEY=sk-...
```

### 2. Prisma 마이그레이션
기존 스키마 변경 없음. 추가 마이그레이션 불필요.

### 3. 크론 스케줄러
- 서버 시간 기준으로 작동
- 프로덕션 환경에서는 서버 타임존 확인 필수
- 현재 설정: 매시간 정각 (0분)

### 4. 성능 모니터링
```bash
# Redis 캐시 확인
redis-cli
> KEYS admin:token:stats
> TTL admin:token:stats

# 알림 발송 로그 확인
tail -f apps/api/logs/application.log | grep "토큰 임계값"
```

---

## 📈 예상 효과

### 사용자 경험
- ✅ 토큰 부족 시 사전 경고 → 갑작스런 차단 방지
- ✅ 명확한 구매 유도 → 이탈률 감소
- ✅ 실시간 경고 표시 → 사용자 인지 향상

### 운영 효율
- ✅ 자동 알림 시스템 → 수동 개입 감소
- ✅ 관리자 대시보드 → 사용 패턴 파악
- ✅ 캐싱 최적화 → 서버 부하 감소

### 비즈니스
- ✅ 토큰 구매 전환율 향상 예상
- ✅ 사용자 만족도 개선
- ✅ 운영 비용 절감

---

## 🚀 배포 체크리스트

### Backend
```bash
# 1. 의존성 설치 확인
cd apps/api
pnpm install

# 2. TypeScript 컴파일 확인
pnpm run build

# 3. 환경 변수 설정
cp .env.example .env.production
# REDIS_HOST, OPENAI_API_KEY 등 설정

# 4. 서버 재시작
pm2 restart api
```

### Frontend
```bash
# 1. 의존성 설치 확인
cd apps/web
pnpm install

# 2. 빌드
pnpm run build

# 3. 배포
vercel deploy --prod
```

### 검증
```bash
# 1. Health Check
curl http://localhost:3000/health

# 2. 크론 작동 확인
# 1시간 후 로그 확인

# 3. 관리자 통계 접근 확인
curl http://localhost:3000/api/admin/token-stats \
  -H "Authorization: Bearer <admin-token>"
```

---

## 📚 추가 문서

### API 문서
- Swagger: `http://localhost:3000/api/docs`
- Postman Collection: `docs/postman/token-management.json`

### 아키텍처 다이어그램
```
User Dashboard (Frontend)
    ↓
AIUsageCard.tsx (경고 표시)
    ↓
GET /api/ai-usage
    ↓
AIUsageService.getUsageState()
    ↓
Database (AIUsage 테이블)

---

AI Chat (Frontend)
    ↓
POST /api/chat/send
    ↓
ChatService.sendMessage()
    ↓ (토큰 체크)
AIUsageService.getUsageState()
    ↓ (OpenAI 호출)
OpenAIService.generateChatResponse()
    ↓ (토큰 차감)
AIUsageService.addTurnUsage()

---

Cron Scheduler (매시간)
    ↓
TokenNotificationScheduler.checkTokenThresholds()
    ↓ (90% 이상 사용자 조회)
Database.findMany()
    ↓ (알림 발송)
NotificationService.create()
```

---

## 🎯 향후 개선 방향

### 단기 (1개월)
- [ ] 프론트엔드 알림 팝업 구현
- [ ] 토큰 구매 플로우 개선
- [ ] 사용 패턴 분석 리포트

### 중기 (3개월)
- [ ] TokenUsageHistory 모델 추가 (필요 시)
- [ ] 대화 아카이브 시스템 도입
- [ ] 예측 모델 (토큰 소진 시점 예측)

### 장기 (6개월)
- [ ] AI 모델별 토큰 차등 정책
- [ ] 구독 플랜 연동
- [ ] 기업용 대량 토큰 관리

---

## 📞 문의

**개발 담당**: AI 채팅 토큰 관리 팀
**이슈 보고**: GitHub Issues
**긴급 연락**: [Slack #token-management]

---

**구현 완료일**: 2025-10-21
**다음 검토일**: 2025-11-21 (1개월 후)
