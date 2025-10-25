# 전문가 응답시간 추적 기능 구현 계획

## 📋 개요

현재 전문가 프로필에서 응답시간이 정적 문자열(`responseTime: "2시간 내"`)로 표시되고 있습니다. 이를 실제 전문가의 응답 행동을 기반으로 계산된 동적 값으로 전환하는 기능을 구현합니다.

## 🎯 목표

- ✅ 실제 데이터 기반 응답시간 계산
- ✅ 문의하기 및 예약하기 응답 시간 추적
- ✅ 자동 업데이트 시스템
- ✅ 사용자 친화적 표시 형식
- ✅ 기존 시스템과의 호환성 유지

## 📊 현재 시스템 분석

### 기존 데이터 구조

```prisma
model Expert {
  responseTime String @default("2시간 내")  // 정적 문자열
  // ... 기타 필드
}

model Inquiry {
  createdAt DateTime @default(now())  // 문의 생성 시간
  reply InquiryReply?                 // 답변 관계
}

model InquiryReply {
  createdAt DateTime @default(now())  // 답변 생성 시간
}

model Reservation {
  createdAt   DateTime @default(now())  // 예약 생성 시간
  confirmedAt DateTime?                 // 예약 확정 시간
}
```

### 응답시간 계산 가능 이벤트

1. **문의 시스템**: `InquiryReply.createdAt - Inquiry.createdAt`
2. **예약 시스템**: `Reservation.confirmedAt - Reservation.createdAt`

## 🏗️ 구현 계획

### Phase 1: 데이터베이스 스키마 변경

#### 1.1 Expert 모델에 필드 추가

```prisma
model Expert {
  // 기존 필드
  responseTime String @default("2시간 내")

  // 새로운 필드 추가
  avgResponseTimeMinutes    Int?      // 평균 응답시간 (분 단위)
  responseTimeCalculatedAt  DateTime? // 마지막 계산 시간
  responseTimeSampleSize    Int       @default(0) // 샘플 수 (통계 신뢰도)
}
```

#### 1.2 마이그레이션 생성

```bash
# apps/api 디렉토리에서 실행
npx prisma migrate dev --name add_expert_response_time_tracking
```

### Phase 2: 응답시간 계산 서비스 구현

#### 2.1 계산 로직 구현

**파일**: `apps/api/src/experts/expert-stats.service.ts` (신규 생성)

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpertStatsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 전문가의 평균 응답시간 계산 및 업데이트
   * @param expertId 전문가 ID
   * @returns 계산된 평균 응답시간 (분)
   */
  async calculateAndUpdateResponseTime(expertId: number): Promise<number | null> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. 문의 응답시간 계산 (최근 30일)
    const inquiryResponses = await this.prisma.inquiry.findMany({
      where: {
        expertId,
        createdAt: { gte: thirtyDaysAgo },
        reply: { isNot: null }
      },
      include: { reply: true }
    });

    const inquiryResponseTimes = inquiryResponses
      .map(inq => {
        const diffMs = inq.reply!.createdAt.getTime() - inq.createdAt.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return diffMinutes;
      })
      .filter(minutes => minutes > 0 && minutes <= 20160); // 최대 14일 (이상치 제거)

    // 2. 예약 확정 응답시간 계산 (최근 30일)
    const reservationResponses = await this.prisma.reservation.findMany({
      where: {
        expertId,
        createdAt: { gte: thirtyDaysAgo },
        confirmedAt: { isNot: null }
      }
    });

    const reservationResponseTimes = reservationResponses
      .map(res => {
        const diffMs = res.confirmedAt!.getTime() - res.createdAt.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return diffMinutes;
      })
      .filter(minutes => minutes > 0 && minutes <= 20160); // 최대 14일

    // 3. 전체 응답시간 데이터 결합 (문의 70%, 예약 30% 가중치)
    const allResponseTimes = [
      ...inquiryResponseTimes,
      ...inquiryResponseTimes, // 2번 추가 = 70% 가중치
      ...reservationResponseTimes
    ];

    // 4. 최소 3개 샘플 필요
    if (allResponseTimes.length < 3) {
      return null;
    }

    // 5. 평균 계산
    const avgMinutes = Math.round(
      allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length
    );

    // 6. Expert 모델 업데이트
    await this.prisma.expert.update({
      where: { id: expertId },
      data: {
        avgResponseTimeMinutes: avgMinutes,
        responseTimeCalculatedAt: new Date(),
        responseTimeSampleSize: inquiryResponseTimes.length + reservationResponseTimes.length
      }
    });

    return avgMinutes;
  }

  /**
   * 분 단위 응답시간을 사람이 읽기 쉬운 문자열로 변환
   */
  formatResponseTime(minutes: number | null): string {
    if (minutes === null) {
      return '응답 시간 미측정';
    }

    if (minutes <= 60) return '1시간 내';
    if (minutes <= 120) return '2시간 내';
    if (minutes <= 360) return '6시간 내';
    if (minutes <= 720) return '12시간 내';
    if (minutes <= 1440) return '1일 내';
    if (minutes <= 2880) return '2일 내';
    if (minutes <= 10080) return '3-7일';
    return '7일 이상';
  }

  /**
   * 전문가의 응답시간 통계 조회
   */
  async getResponseTimeStats(expertId: number) {
    const expert = await this.prisma.expert.findUnique({
      where: { id: expertId },
      select: {
        avgResponseTimeMinutes: true,
        responseTimeCalculatedAt: true,
        responseTimeSampleSize: true,
        responseTime: true // 수동 설정값 (fallback)
      }
    });

    if (!expert) {
      throw new Error('전문가를 찾을 수 없습니다.');
    }

    return {
      avgResponseTimeMinutes: expert.avgResponseTimeMinutes,
      formattedResponseTime: expert.avgResponseTimeMinutes
        ? this.formatResponseTime(expert.avgResponseTimeMinutes)
        : expert.responseTime, // fallback to manual value
      calculatedAt: expert.responseTimeCalculatedAt,
      sampleSize: expert.responseTimeSampleSize,
      isCalculated: expert.avgResponseTimeMinutes !== null
    };
  }
}
```

#### 2.2 ExpertStatsService를 ExpertsModule에 추가

**파일**: `apps/api/src/experts/experts.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ExpertsService } from './experts.service';
import { ExpertsController } from './experts.controller';
import { ExpertStatsService } from './expert-stats.service'; // 추가
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExpertsController],
  providers: [
    ExpertsService,
    ExpertStatsService // 추가
  ],
  exports: [
    ExpertsService,
    ExpertStatsService // 다른 모듈에서 사용 가능하도록 export
  ]
})
export class ExpertsModule {}
```

### Phase 3: 자동 업데이트 통합

#### 3.1 문의 답변 시 응답시간 업데이트

**파일**: `apps/api/src/inquiry/inquiry.service.ts`

```typescript
import { ExpertStatsService } from '../experts/expert-stats.service';

@Injectable()
export class InquiryService {
  constructor(
    private prisma: PrismaService,
    private expertStatsService: ExpertStatsService // 추가
  ) {}

  async createReply(userId: number, inquiryId: string, dto: CreateReplyDto) {
    // ... 기존 코드 ...

    const reply = await this.prisma.inquiryReply.create({
      data: {
        inquiryId,
        content: dto.content
      }
    });

    await this.prisma.inquiry.update({
      where: { id: inquiryId },
      data: { isRead: true, updatedAt: new Date() }
    });

    // ✨ 응답시간 통계 업데이트 (비동기, 실패해도 메인 작업에 영향 없음)
    this.expertStatsService.calculateAndUpdateResponseTime(expert.id)
      .catch(err => {
        console.error('응답시간 계산 실패:', err);
      });

    return {
      replyId: reply.id,
      inquiryId,
      content: reply.content,
      createdAt: reply.createdAt
    };
  }
}
```

#### 3.2 예약 확정 시 응답시간 업데이트

**파일**: `apps/api/src/reservations/reservations.service.ts` (찾아서 수정)

```typescript
import { ExpertStatsService } from '../experts/expert-stats.service';

@Injectable()
export class ReservationsService {
  constructor(
    private prisma: PrismaService,
    private expertStatsService: ExpertStatsService // 추가
  ) {}

  async confirmReservation(expertId: number, reservationId: string) {
    // ... 기존 예약 확정 로직 ...

    const reservation = await this.prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date()
      }
    });

    // ✨ 응답시간 통계 업데이트
    this.expertStatsService.calculateAndUpdateResponseTime(expertId)
      .catch(err => {
        console.error('응답시간 계산 실패:', err);
      });

    return reservation;
  }
}
```

### Phase 4: API 엔드포인트 추가

#### 4.1 전문가 통계 조회 엔드포인트

**파일**: `apps/api/src/experts/experts.controller.ts`

```typescript
import { ExpertStatsService } from './expert-stats.service';

@Controller('experts')
export class ExpertsController {
  constructor(
    private expertsService: ExpertsService,
    private expertStatsService: ExpertStatsService // 추가
  ) {}

  // 새로운 엔드포인트 추가
  @Get(':displayId/stats/response-time')
  async getResponseTimeStats(@Param('displayId') displayId: string) {
    const expert = await this.expertsService.findByDisplayId(displayId);
    const stats = await this.expertStatsService.getResponseTimeStats(expert.id);

    return {
      success: true,
      data: stats
    };
  }
}
```

#### 4.2 전문가 프로필 응답에 응답시간 포함

**파일**: `apps/api/src/experts/experts.service.ts`

```typescript
async findByDisplayId(displayId: string) {
  const expert = await this.prisma.expert.findUnique({
    where: { displayId },
    include: {
      // ... 기존 include
    }
  });

  // 응답시간 포맷팅 추가
  const formattedResponseTime = expert.avgResponseTimeMinutes
    ? this.expertStatsService.formatResponseTime(expert.avgResponseTimeMinutes)
    : expert.responseTime;

  return {
    ...expert,
    responseTime: formattedResponseTime, // 계산된 값 또는 수동 값
    responseTimeStats: {
      avgMinutes: expert.avgResponseTimeMinutes,
      calculatedAt: expert.responseTimeCalculatedAt,
      sampleSize: expert.responseTimeSampleSize
    }
  };
}
```

### Phase 5: 프론트엔드 업데이트

#### 5.1 ExpertProfileDetail 컴포넌트 수정

**파일**: `apps/web/src/components/experts/ExpertProfileDetail.tsx`

**위치**: Line 579 근처

```typescript
{/* 현재 코드 */}
<div className="flex items-center">
  <Clock className="h-4 w-4 mr-1" />
  <span>{(expertData as any).responseTime || "2시간 내"} 응답</span>
</div>

{/* 개선된 코드 */}
<div className="flex items-center">
  <Clock className="h-4 w-4 mr-1" />
  <span>
    {(expertData as any).responseTime || "2시간 내"} 응답
  </span>
  {(expertData as any).responseTimeStats?.isCalculated && (
    <span className="ml-2 text-xs text-gray-500" title={`${(expertData as any).responseTimeStats.sampleSize}개 응답 기준`}>
      (실제 데이터 기반)
    </span>
  )}
</div>
```

#### 5.2 응답시간 통계 표시 (선택사항)

전문가 프로필 사이드바에 상세 통계 추가:

```tsx
{/* 응답시간 상세 정보 (전문가 본인만 볼 수 있도록) */}
{isOwner && (expertData as any).responseTimeStats && (
  <div className="bg-blue-50 p-3 rounded-lg mt-4">
    <h4 className="text-sm font-semibold text-blue-900 mb-2">응답시간 통계</h4>
    <div className="space-y-1 text-xs text-blue-700">
      <div className="flex justify-between">
        <span>평균 응답시간</span>
        <span className="font-medium">
          {(expertData as any).responseTimeStats.avgMinutes}분
        </span>
      </div>
      <div className="flex justify-between">
        <span>응답 샘플 수</span>
        <span className="font-medium">
          {(expertData as any).responseTimeStats.sampleSize}개
        </span>
      </div>
      {(expertData as any).responseTimeStats.calculatedAt && (
        <div className="flex justify-between">
          <span>마지막 계산</span>
          <span className="font-medium">
            {new Date((expertData as any).responseTimeStats.calculatedAt).toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  </div>
)}
```

### Phase 6: 백그라운드 작업 (선택사항)

주기적으로 모든 전문가의 응답시간을 재계산하는 스케줄 작업:

**파일**: `apps/api/src/experts/expert-stats.scheduler.ts` (신규 생성)

```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ExpertStatsService } from './expert-stats.service';

@Injectable()
export class ExpertStatsScheduler {
  constructor(
    private prisma: PrismaService,
    private expertStatsService: ExpertStatsService
  ) {}

  // 매일 새벽 3시에 모든 활성 전문가의 응답시간 재계산
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async recalculateAllResponseTimes() {
    console.log('🔄 전문가 응답시간 일괄 재계산 시작...');

    const activeExperts = await this.prisma.expert.findMany({
      where: { isActive: true },
      select: { id: true, displayId: true }
    });

    let successCount = 0;
    let errorCount = 0;

    for (const expert of activeExperts) {
      try {
        await this.expertStatsService.calculateAndUpdateResponseTime(expert.id);
        successCount++;
      } catch (error) {
        console.error(`❌ 전문가 ${expert.displayId} 응답시간 계산 실패:`, error);
        errorCount++;
      }
    }

    console.log(`✅ 응답시간 재계산 완료: 성공 ${successCount}, 실패 ${errorCount}`);
  }
}
```

**파일**: `apps/api/src/experts/experts.module.ts` (SchedulerModule 추가)

```typescript
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ExpertStatsScheduler } from './expert-stats.scheduler';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot() // 스케줄러 활성화
  ],
  controllers: [ExpertsController],
  providers: [
    ExpertsService,
    ExpertStatsService,
    ExpertStatsScheduler // 추가
  ],
  exports: [ExpertsService, ExpertStatsService]
})
export class ExpertsModule {}
```

## 📝 구현 체크리스트

### Backend

- [ ] 1. Prisma schema에 필드 추가 (`avgResponseTimeMinutes`, `responseTimeCalculatedAt`, `responseTimeSampleSize`)
- [ ] 2. 마이그레이션 생성 및 실행
- [ ] 3. `ExpertStatsService` 생성 및 구현
  - [ ] `calculateAndUpdateResponseTime()` 메서드
  - [ ] `formatResponseTime()` 메서드
  - [ ] `getResponseTimeStats()` 메서드
- [ ] 4. `ExpertsModule`에 `ExpertStatsService` 추가
- [ ] 5. `InquiryService`에 응답시간 업데이트 통합
- [ ] 6. `ReservationsService`에 응답시간 업데이트 통합
- [ ] 7. API 엔드포인트 추가 (`GET /experts/:displayId/stats/response-time`)
- [ ] 8. 전문가 프로필 응답에 응답시간 통계 포함
- [ ] 9. (선택) 백그라운드 스케줄러 구현

### Frontend

- [ ] 10. `ExpertProfileDetail` 컴포넌트에 응답시간 표시 개선
- [ ] 11. 실제 데이터 기반 표시 인디케이터 추가
- [ ] 12. (선택) 전문가용 응답시간 통계 대시보드

### Testing

- [ ] 13. 문의 답변 후 응답시간 자동 업데이트 테스트
- [ ] 14. 예약 확정 후 응답시간 자동 업데이트 테스트
- [ ] 15. 샘플 데이터 부족 시 fallback 동작 테스트
- [ ] 16. 이상치 필터링 테스트 (14일 초과 응답)
- [ ] 17. API 엔드포인트 응답 형식 검증

## 🎨 UI 개선 예시

### 현재 표시
```
⏰ 2시간 내 응답
```

### 개선된 표시
```
⏰ 1일 내 응답 (실제 데이터 기반)
   └─ 마지막 15건 응답 평균
```

### 전문가 대시보드 (본인만 볼 수 있음)
```
📊 응답시간 통계
   • 평균 응답시간: 387분 (6.5시간)
   • 응답 샘플 수: 15개
   • 마지막 계산: 2025-01-26
   • 표시: "12시간 내"
```

## 🔧 기술적 고려사항

### 성능 최적화
- 응답시간 계산은 비동기로 실행 (메인 작업 블로킹 방지)
- 최근 30일 데이터만 조회 (인덱스 활용)
- 실패해도 메인 기능에 영향 없도록 try-catch 처리

### 데이터 품질
- 최소 3개 샘플 필요 (통계적 신뢰도)
- 이상치 제거 (14일 초과 응답 제외)
- 문의 70%, 예약 30% 가중치 적용

### 호환성
- 기존 `responseTime` 필드 유지 (수동 설정 가능)
- 계산된 값이 없으면 수동 값으로 fallback
- 점진적 마이그레이션 가능

## 📈 예상 효과

1. **신뢰도 향상**: 실제 데이터 기반 정보 제공
2. **투명성 증대**: 계산 근거와 샘플 수 표시
3. **전문가 동기부여**: 빠른 응답 유도
4. **사용자 경험**: 정확한 기대치 설정

## 🚀 배포 계획

1. **개발 환경 테스트**: 마이그레이션 및 기능 검증
2. **스테이징 배포**: 실제 데이터로 동작 확인
3. **프로덕션 배포**: 단계적 롤아웃
   - Phase 1: 백엔드 스키마 및 서비스 배포
   - Phase 2: API 엔드포인트 활성화
   - Phase 3: 프론트엔드 UI 업데이트
   - Phase 4: 백그라운드 스케줄러 활성화

## 📚 참고 문서

- Prisma Schema: `apps/api/prisma/schema.prisma`
- Inquiry Service: `apps/api/src/inquiry/inquiry.service.ts`
- Expert Profile: `apps/web/src/components/experts/ExpertProfileDetail.tsx`
- Reservation Service: `apps/api/src/reservations/` (찾아서 확인 필요)

---

**작성일**: 2025-01-26
**작성자**: Claude Code Analysis
**상태**: 구현 대기 중
