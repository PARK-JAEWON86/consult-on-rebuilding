# 관리자 대시보드 시스템 설계

## 📋 개요

전문가 지원 검수, 일일 지표 모니터링, 사용자/전문가 관리를 위한 종합 관리자 대시보드 시스템

---

## 🎯 핵심 요구사항

### 1. 전문가 지원 관리
- 대기 중인 지원(PENDING) 목록 조회
- 지원 상세 정보 확인 (프로필, 자격증, 경력 등)
- 승인/거절 처리 및 메모 작성
- 검수 이력 추적

### 2. 일일 지표 모니터링
- 신규 가입자 수 (일/주/월)
- 전문가 지원 수 (일/주/월)
- 예약 건수 및 매출
- 활성 사용자 통계
- 리뷰 평점 평균

### 3. 사용자/전문가 관리
- 전체 사용자 목록 및 검색
- 사용자 상태 관리 (활성/정지/탈퇴)
- 전문가 프로필 관리
- 크레딧 거래 내역 조회

### 4. 컨텐츠 관리
- 커뮤니티 게시글 관리
- 신고 처리
- 카테고리 관리

---

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────┐
│           Admin Dashboard Frontend              │
│  (Next.js 14 App Router + React + TypeScript)   │
└─────────────────────┬───────────────────────────┘
                      │
                      │ HTTP/REST
                      │
┌─────────────────────▼───────────────────────────┐
│            Admin API Backend                    │
│         (NestJS + Prisma + MySQL)               │
├─────────────────────────────────────────────────┤
│  • Authentication (ADMIN role check)            │
│  • ExpertApplications Service                   │
│  • Analytics Service                            │
│  • User Management Service                      │
│  • Content Moderation Service                   │
└─────────────────────┬───────────────────────────┘
                      │
                      │ Prisma ORM
                      │
┌─────────────────────▼───────────────────────────┐
│              MySQL Database                     │
│  • ExpertApplication (지원 데이터)               │
│  • User (사용자 데이터)                          │
│  • Expert (전문가 데이터)                        │
│  • Reservation (예약 데이터)                     │
│  • Analytics 집계 테이블                         │
└─────────────────────────────────────────────────┘
```

---

## 📊 데이터베이스 설계

### 기존 모델 활용

#### ExpertApplication (이미 존재)
```prisma
model ExpertApplication {
  id                Int                     @id @default(autoincrement())
  displayId         String                  @unique
  userId            Int
  name              String
  email             String
  jobTitle          String?
  specialty         String
  experienceYears   Int                     @default(0)
  bio               String
  keywords          Json
  consultationTypes Json
  availability      Json
  certifications    Json
  profileImage      String?
  status            ExpertApplicationStatus @default(PENDING)
  reviewedAt        DateTime?
  reviewedBy        Int?                    // 검수한 관리자 ID
  reviewNotes       String?                 // 검수 메모
  createdAt         DateTime                @default(now())
  updatedAt         DateTime                @updatedAt
}
```

### 새로운 모델 추가 필요

#### AdminUser (관리자 계정)
```prisma
model AdminUser {
  id          Int      @id @default(autoincrement())
  userId      Int      @unique
  role        AdminRole @default(MODERATOR)
  permissions Json     // 세부 권한 설정
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id])

  @@index([userId])
}

enum AdminRole {
  SUPER_ADMIN   // 모든 권한
  ADMIN         // 대부분의 권한
  MODERATOR     // 컨텐츠 관리만
  ANALYST       // 읽기 전용 분석
}
```

#### DailyMetrics (일일 지표 집계)
```prisma
model DailyMetrics {
  id                    Int      @id @default(autoincrement())
  date                  DateTime @unique @db.Date
  newUsers              Int      @default(0)
  newExpertApplications Int      @default(0)
  approvedExperts       Int      @default(0)
  rejectedExperts       Int      @default(0)
  totalReservations     Int      @default(0)
  completedReservations Int      @default(0)
  canceledReservations  Int      @default(0)
  totalRevenue          Int      @default(0)
  avgReservationValue   Float    @default(0)
  activeUsers           Int      @default(0)
  newReviews            Int      @default(0)
  avgRating             Float    @default(0)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([date])
}
```

#### AuditLog (관리자 활동 로그)
```prisma
model AuditLog {
  id          Int      @id @default(autoincrement())
  adminUserId Int
  action      String   // "approve_expert", "reject_expert", "suspend_user", etc.
  targetType  String   // "ExpertApplication", "User", "Expert", etc.
  targetId    Int
  details     Json?    // 상세 정보
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())

  @@index([adminUserId, createdAt])
  @@index([targetType, targetId])
  @@index([createdAt])
}
```

---

## 🔐 보안 및 인증

### 권한 체계

```typescript
// apps/api/src/auth/guards/admin.guard.ts
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // User roles에 ADMIN 포함 여부 확인
    return user?.roles?.includes('ADMIN');
  }
}

// 세분화된 권한 체크
export class PermissionGuard implements CanActivate {
  constructor(private requiredPermission: AdminPermission) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // AdminUser 테이블에서 권한 확인
    return hasPermission(user.id, this.requiredPermission);
  }
}
```

### 인증 플로우
1. 관리자는 일반 로그인으로 인증
2. JWT에 roles 배열 포함 (`['USER', 'ADMIN']`)
3. AdminGuard로 관리자 페이지 접근 제어
4. PermissionGuard로 세부 기능별 권한 체크

---

## 🎨 프론트엔드 구조

### 페이지 구조

```
apps/web/src/app/
└── admin/
    ├── layout.tsx                    # 관리자 레이아웃 (사이드바)
    ├── page.tsx                       # 대시보드 메인 (지표 요약)
    ├── applications/
    │   ├── page.tsx                   # 전문가 지원 목록
    │   └── [id]/
    │       └── page.tsx               # 지원 상세 및 검수
    ├── users/
    │   ├── page.tsx                   # 사용자 목록
    │   └── [id]/
    │       └── page.tsx               # 사용자 상세
    ├── experts/
    │   ├── page.tsx                   # 전문가 목록
    │   └── [id]/
    │       └── page.tsx               # 전문가 상세
    ├── analytics/
    │   └── page.tsx                   # 상세 분석 대시보드
    ├── content/
    │   ├── posts/page.tsx             # 게시글 관리
    │   ├── comments/page.tsx          # 댓글 관리
    │   └── reports/page.tsx           # 신고 관리
    └── settings/
        └── page.tsx                   # 관리자 설정
```

### 컴포넌트 구조

```
apps/web/src/components/admin/
├── layout/
│   ├── AdminSidebar.tsx              # 관리자 사이드바
│   ├── AdminHeader.tsx               # 관리자 헤더
│   └── AdminBreadcrumb.tsx           # 경로 표시
├── dashboard/
│   ├── MetricCard.tsx                # 지표 카드
│   ├── TrendChart.tsx                # 추세 차트 (recharts)
│   ├── RecentActivity.tsx            # 최근 활동
│   └── QuickActions.tsx              # 빠른 작업
├── applications/
│   ├── ApplicationList.tsx           # 지원 목록 테이블
│   ├── ApplicationCard.tsx           # 지원 카드
│   ├── ApplicationDetail.tsx         # 상세 정보
│   ├── ReviewForm.tsx                # 검수 폼
│   └── ApplicationFilters.tsx        # 필터
├── users/
│   ├── UserTable.tsx                 # 사용자 테이블
│   ├── UserDetail.tsx                # 사용자 상세
│   └── UserActions.tsx               # 사용자 관리 액션
├── analytics/
│   ├── TimeSeriesChart.tsx           # 시계열 차트
│   ├── CategoryChart.tsx             # 카테고리별 차트
│   ├── ConversionFunnel.tsx          # 전환 퍼널
│   └── MetricsGrid.tsx               # 지표 그리드
└── common/
    ├── DataTable.tsx                 # 재사용 가능 테이블
    ├── StatusBadge.tsx               # 상태 배지
    ├── ActionMenu.tsx                # 액션 메뉴
    └── ConfirmDialog.tsx             # 확인 다이얼로그
```

---

## 🔌 API 엔드포인트 설계

### 전문가 지원 관리

```typescript
// apps/api/src/admin/expert-applications/

GET    /api/admin/applications
  Query: { status?, page?, limit?, search? }
  Response: {
    data: ExpertApplication[]
    total: number
    page: number
    totalPages: number
  }

GET    /api/admin/applications/:id
  Response: {
    application: ExpertApplication
    user: User (신청자 정보)
    previousApplications: ExpertApplication[] (이전 지원 이력)
  }

PUT    /api/admin/applications/:id/approve
  Body: { reviewNotes?: string }
  Response: { success: true, expert: Expert }
  Actions:
    1. ExpertApplication.status = APPROVED
    2. Expert 레코드 생성
    3. User.roles에 'EXPERT' 추가
    4. 이메일 발송
    5. AuditLog 생성

PUT    /api/admin/applications/:id/reject
  Body: { reviewNotes: string }
  Response: { success: true }
  Actions:
    1. ExpertApplication.status = REJECTED
    2. 이메일 발송
    3. AuditLog 생성
```

### 일일 지표

```typescript
// apps/api/src/admin/analytics/

GET    /api/admin/analytics/dashboard
  Query: { period: 'day' | 'week' | 'month' }
  Response: {
    summary: {
      newUsers: { value, change }
      newApplications: { value, change }
      revenue: { value, change }
      activeUsers: { value, change }
    }
    charts: {
      userGrowth: DataPoint[]
      revenueByDay: DataPoint[]
      reservationsByStatus: CategoryData[]
    }
    recentActivity: Activity[]
  }

GET    /api/admin/analytics/metrics
  Query: { startDate, endDate }
  Response: DailyMetrics[]

GET    /api/admin/analytics/expert-funnel
  Response: {
    total: number
    pending: number
    approved: number
    rejected: number
    conversionRate: number
  }
```

### 사용자 관리

```typescript
// apps/api/src/admin/users/

GET    /api/admin/users
  Query: { page?, limit?, search?, role?, status? }
  Response: {
    data: User[]
    total: number
  }

GET    /api/admin/users/:id
  Response: {
    user: User
    expert?: Expert
    stats: {
      totalReservations: number
      totalSpent: number
      joinDate: Date
      lastActive: Date
    }
    recentActivity: Activity[]
  }

PUT    /api/admin/users/:id/suspend
  Body: { reason: string, duration?: number }
  Response: { success: true }

PUT    /api/admin/users/:id/reactivate
  Response: { success: true }
```

---

## 📈 데이터 시각화 설계

### 차트 라이브러리 선택
**Recharts** 사용 (설치 필요: `npm install recharts`)

이유:
- React 친화적
- 선언적 API
- 반응형 디자인
- TypeScript 지원
- 다양한 차트 타입

### 주요 차트

#### 1. 사용자 증가 추세 (Line Chart)
```typescript
<LineChart data={userGrowthData}>
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Line type="monotone" dataKey="newUsers" stroke="#3b82f6" />
  <Line type="monotone" dataKey="totalUsers" stroke="#10b981" />
</LineChart>
```

#### 2. 전문가 지원 상태 (Pie Chart)
```typescript
<PieChart>
  <Pie
    data={applicationStatusData}
    dataKey="value"
    nameKey="name"
    cx="50%"
    cy="50%"
    outerRadius={80}
    fill="#8884d8"
    label
  />
</PieChart>
```

#### 3. 일별 매출 (Bar Chart)
```typescript
<BarChart data={dailyRevenueData}>
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="revenue" fill="#f59e0b" />
</BarChart>
```

---

## 🚀 구현 단계

### Phase 1: 기본 인프라 (1-2일)
1. ✅ AdminUser 모델 생성 및 마이그레이션
2. ✅ AdminGuard 구현
3. ✅ 관리자 레이아웃 생성
4. ✅ 기본 라우팅 구조

### Phase 2: 전문가 지원 관리 (2-3일)
1. ✅ 지원 목록 API 및 페이지
2. ✅ 지원 상세 API 및 페이지
3. ✅ 승인/거절 API 및 UI
4. ✅ 이메일 알림 통합

### Phase 3: 일일 지표 대시보드 (2-3일)
1. ✅ DailyMetrics 모델 및 집계 로직
2. ✅ 대시보드 API 엔드포인트
3. ✅ Recharts 통합 및 차트 컴포넌트
4. ✅ 실시간 지표 업데이트

### Phase 4: 사용자 관리 (2일)
1. ✅ 사용자 목록/검색 API
2. ✅ 사용자 상세 페이지
3. ✅ 사용자 상태 관리 (정지/재활성화)

### Phase 5: 감사 및 보안 (1-2일)
1. ✅ AuditLog 시스템
2. ✅ 관리자 활동 추적
3. ✅ IP 제한 및 보안 강화

### Phase 6: 최적화 및 테스트 (1-2일)
1. ✅ 성능 최적화
2. ✅ 에러 처리 강화
3. ✅ E2E 테스트

---

## 🎨 UI/UX 가이드라인

### 디자인 원칙
- **정보 밀도**: 관리자는 한 눈에 많은 정보 확인 필요
- **효율성**: 최소 클릭으로 작업 완료
- **명확성**: 상태와 액션이 명확히 구분
- **반응성**: 모든 액션에 즉각적인 피드백

### 색상 시스템
```typescript
const statusColors = {
  PENDING: 'yellow-500',    // 대기
  APPROVED: 'green-500',    // 승인
  REJECTED: 'red-500',      // 거절
  ACTIVE: 'blue-500',       // 활성
  SUSPENDED: 'orange-500',  // 정지
}
```

### 레이아웃
- **사이드바**: 고정, 접을 수 있음
- **헤더**: 검색, 알림, 프로필
- **메인**: 최대 너비 활용, 그리드 레이아웃

---

## 📱 반응형 디자인

### 브레이크포인트
- **Desktop**: 1280px+ (기본 타겟)
- **Tablet**: 768px-1279px (사이드바 접힘)
- **Mobile**: <768px (간소화된 뷰)

### 모바일 최적화
- 테이블 → 카드 뷰 전환
- 차트 크기 조정
- 액션 메뉴 하단 고정

---

## 🔧 개발 환경 설정

### 필수 패키지 설치
```bash
cd apps/web
npm install recharts date-fns
```

### 환경 변수
```env
# .env
ADMIN_SESSION_TIMEOUT=3600000  # 1시간
ADMIN_MAX_LOGIN_ATTEMPTS=5
ADMIN_IP_WHITELIST=            # 선택적
```

---

## 📊 성능 고려사항

### 데이터베이스 최적화
1. **인덱스**:
   - ExpertApplication: `(status, createdAt)`
   - DailyMetrics: `(date)`
   - AuditLog: `(adminUserId, createdAt)`

2. **쿼리 최적화**:
   - 페이지네이션 필수
   - 필요한 필드만 select
   - JOIN 최소화

3. **캐싱**:
   - 대시보드 지표: 5분 캐시
   - 사용자 목록: 1분 캐시

### 프론트엔드 최적화
1. **코드 스플리팅**: 관리자 페이지 별도 번들
2. **데이터 페칭**: React Query로 캐싱
3. **차트**: 데이터 포인트 제한 (최대 100개)

---

## 🔒 보안 체크리스트

- [ ] AdminGuard로 모든 관리자 라우트 보호
- [ ] 세션 타임아웃 구현
- [ ] CSRF 토큰 검증
- [ ] SQL Injection 방지 (Prisma ORM 사용)
- [ ] XSS 방지 (입력 sanitization)
- [ ] Rate Limiting (관리자 API)
- [ ] IP 화이트리스트 (선택적)
- [ ] 2FA 지원 (향후)
- [ ] AuditLog로 모든 관리자 활동 추적

---

## 📝 다음 단계

1. **Phase 1 시작**: AdminUser 모델 생성
2. **Context7 활용**: Recharts 공식 문서 참조
3. **점진적 구현**: 각 단계별로 테스트 후 다음 단계 진행
4. **피드백 반영**: 실사용 피드백으로 UI/UX 개선

---

## 💡 추가 기능 아이디어 (향후)

- 📧 이메일 템플릿 관리
- 📢 공지사항 관리
- 🎟️ 쿠폰/프로모션 관리
- 💬 실시간 CS 대시보드
- 📊 맞춤형 리포트 생성
- 🤖 AI 기반 이상 탐지
- 📱 모바일 관리자 앱
