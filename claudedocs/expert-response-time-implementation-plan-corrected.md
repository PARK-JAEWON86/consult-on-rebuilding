# 전문가 응답시간 추적 기능 구현 계획 (수정본)

## 🔍 검토 결과 요약

원본 계획을 심층 분석한 결과, 다음의 중요한 문제점들이 발견되어 수정했습니다:

### ⚠️ 치명적 문제 (CRITICAL - 구현 실패 원인)

1. **모듈 의존성 오류**
   - ❌ ExpertsModule에 PrismaModule import 누락
   - ❌ ExpertsModule에 exports 배열 누락
   - ❌ ReservationsModule, InquiryModule에서 ExpertsModule import 누락
   - ✅ **수정**: 모든 모듈 의존성 관계 명확히 정의

2. **메서드명 오류**
   - ❌ `confirmReservation()` 메서드가 존재하지 않음 (실제는 `approve()`)
   - ✅ **수정**: ReservationsService의 `approve()` 메서드 사용

3. **서비스 주입 누락**
   - ❌ ExpertsService에서 ExpertStatsService 사용하지만 constructor에 주입 안됨
   - ✅ **수정**: ExpertsService constructor에 ExpertStatsService 의존성 주입 추가

### 🎯 높은 우선순위 문제 (HIGH - 잘못된 결과 산출)

4. **가중평균 계산 오류**
   - ❌ 배열 중복으로 가중치 구현 → 수학적으로 부정확
   - ✅ **수정**: 정확한 가중평균 공식 사용

5. **샘플 크기 계산 혼란**
   - ❌ 실제 샘플 수 vs 가중치 적용된 수 혼동 가능
   - ✅ **수정**: 실제 응답 수만 표시, 가중치는 내부 계산에만 사용

### 📊 중간 우선순위 문제 (MEDIUM - 개선 필요)

6. **예외 처리 개선**
   - ❌ 일반 Error 대신 NestJS NotFoundException 사용
   - ✅ **수정**: 적절한 NestJS 예외 사용

7. **성능 최적화**
   - ❌ 인덱스 추천 누락
   - ✅ **수정**: 성능 최적화 섹션에 인덱스 추가 명시

---

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
  status      ReservationStatus
}
```

### 응답시간 계산 가능 이벤트

1. **문의 시스템**: `InquiryReply.createdAt - Inquiry.createdAt`
2. **예약 시스템**: `Reservation.confirmedAt - Reservation.createdAt` (status: CONFIRMED일 때)

---

## 🏗️ 구현 계획

### Phase 1: 데이터베이스 스키마 변경

#### 1.1 Expert 모델에 필드 추가

**파일**: `apps/api/prisma/schema.prisma`

```prisma
model Expert {
  // 기존 필드들...
  responseTime String @default("2시간 내")

  // 🆕 새로운 필드 추가
  avgResponseTimeMinutes    Int?      // 평균 응답시간 (분 단위)
  responseTimeCalculatedAt  DateTime? // 마지막 계산 시간
  responseTimeSampleSize    Int       @default(0) // 샘플 수 (통계 신뢰도)

  // ... 나머지 필드들

  @@index([avgResponseTimeMinutes]) // 🆕 성능 최적화용 인덱스
}

// 🆕 성능 최적화: 기존 모델에 인덱스 추가
model Inquiry {
  // ... 기존 필드들
  @@index([expertId, createdAt]) // 응답시간 계산 쿼리 최적화
}

model Reservation {
  // ... 기존 필드들
  @@index([expertId, createdAt, status]) // 응답시간 계산 쿼리 최적화
}
```

#### 1.2 마이그레이션 생성 및 실행

```bash
# apps/api 디렉토리에서 실행
cd apps/api
npx prisma migrate dev --name add_expert_response_time_tracking
npx prisma generate
```

---

### Phase 2: 응답시간 계산 서비스 구현

#### 2.1 계산 로직 구현

**파일**: `apps/api/src/experts/expert-stats.service.ts` (🆕 신규 생성)

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpertStatsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 전문가의 평균 응답시간 계산 및 업데이트
   * @param expertId 전문가 ID
   * @returns 계산된 평균 응답시간 (분) 또는 null
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
        status: 'CONFIRMED', // ✅ 수정: status 명시
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

    // 3. ✅ 수정: 정확한 가중평균 계산
    const inquiryCount = inquiryResponseTimes.length;
    const reservationCount = reservationResponseTimes.length;

    // 최소 3개 샘플 필요
    if (inquiryCount + reservationCount < 3) {
      return null;
    }

    let avgMinutes: number;

    if (inquiryCount > 0 && reservationCount > 0) {
      // 둘 다 데이터가 있을 때: 가중평균 (문의 70%, 예약 30%)
      const avgInquiry = inquiryResponseTimes.reduce((sum, t) => sum + t, 0) / inquiryCount;
      const avgReservation = reservationResponseTimes.reduce((sum, t) => sum + t, 0) / reservationCount;
      avgMinutes = Math.round(avgInquiry * 0.7 + avgReservation * 0.3);
    } else if (inquiryCount > 0) {
      // 문의 데이터만 있을 때
      avgMinutes = Math.round(
        inquiryResponseTimes.reduce((sum, t) => sum + t, 0) / inquiryCount
      );
    } else {
      // 예약 데이터만 있을 때
      avgMinutes = Math.round(
        reservationResponseTimes.reduce((sum, t) => sum + t, 0) / reservationCount
      );
    }

    // 4. Expert 모델 업데이트
    await this.prisma.expert.update({
      where: { id: expertId },
      data: {
        avgResponseTimeMinutes: avgMinutes,
        responseTimeCalculatedAt: new Date(),
        responseTimeSampleSize: inquiryCount + reservationCount // ✅ 수정: 실제 응답 수
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
      // ✅ 수정: 적절한 NestJS 예외 사용
      throw new NotFoundException('전문가를 찾을 수 없습니다.');
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
import { ExpertStatsService } from './expert-stats.service'; // 🆕 추가
import { AuthModule } from '../auth/auth.module';
import { ExpertLevelsModule } from '../expert-levels/expert-levels.module';
import { PrismaModule } from '../prisma/prisma.module'; // 🆕 추가

@Module({
  imports: [
    PrismaModule, // 🆕 추가 - ExpertStatsService에서 PrismaService 사용
    AuthModule,
    ExpertLevelsModule
  ],
  controllers: [ExpertsController],
  providers: [
    ExpertsService,
    ExpertStatsService // 🆕 추가
  ],
  exports: [
    ExpertsService,
    ExpertStatsService // 🆕 추가 - 다른 모듈에서 사용 가능하도록 export
  ]
})
export class ExpertsModule {}
```

---

### Phase 3: 자동 업데이트 통합

#### 3.1 문의 답변 시 응답시간 업데이트

**파일**: `apps/api/src/inquiry/inquiry.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { InquiryController } from './inquiry.controller';
import { InquiryService } from './inquiry.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ExpertsModule } from '../experts/experts.module'; // 🆕 추가

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ExpertsModule // 🆕 추가 - ExpertStatsService 사용
  ],
  controllers: [InquiryController],
  providers: [InquiryService],
  exports: [InquiryService]
})
export class InquiryModule {}
```

**파일**: `apps/api/src/inquiry/inquiry.service.ts`

```typescript
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExpertStatsService } from '../experts/expert-stats.service'; // 🆕 추가
import { InquiryCategory } from '@prisma/client';
import { CreateInquiryDto, CreateReplyDto, QueryInquiryDto } from './dto';

@Injectable()
export class InquiryService {
  constructor(
    private prisma: PrismaService,
    private expertStatsService: ExpertStatsService // 🆕 추가
  ) {}

  // ... 기존 메서드들 ...

  async createReply(userId: number, inquiryId: string, dto: CreateReplyDto) {
    const expert = await this.prisma.expert.findUnique({
      where: { userId }
    });

    if (!expert) {
      throw new NotFoundException('전문가 프로필을 찾을 수 없습니다.');
    }

    const inquiry = await this.prisma.inquiry.findFirst({
      where: { id: inquiryId, expertId: expert.id }
    });

    if (!inquiry) {
      throw new NotFoundException('문의를 찾을 수 없습니다.');
    }

    const existingReply = await this.prisma.inquiryReply.findUnique({
      where: { inquiryId }
    });

    if (existingReply) {
      throw new ForbiddenException('이미 답변이 작성되었습니다.');
    }

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

    // 🆕 응답시간 통계 업데이트 (비동기, 실패해도 메인 작업에 영향 없음)
    this.expertStatsService.calculateAndUpdateResponseTime(expert.id)
      .catch(err => {
        console.error('[InquiryService] 응답시간 계산 실패:', err);
      });

    return {
      replyId: reply.id,
      inquiryId,
      content: reply.content,
      createdAt: reply.createdAt
    };
  }

  // ... 나머지 메서드들 ...
}
```

#### 3.2 예약 확정 시 응답시간 업데이트

**파일**: `apps/api/src/reservations/reservations.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CreditsModule } from '../credits/credits.module';
import { ExpertLevelsModule } from '../expert-levels/expert-levels.module';
import { ExpertsModule } from '../experts/experts.module'; // 🆕 추가
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { IdempotencyInterceptor } from '../common/interceptors/idempotency.interceptor';

@Module({
  imports: [
    CreditsModule,
    ExpertLevelsModule,
    ExpertsModule // 🆕 추가 - ExpertStatsService 사용
  ],
  providers: [
    ReservationsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotencyInterceptor,
    },
  ],
  controllers: [ReservationsController],
})
export class ReservationsModule {}
```

**파일**: `apps/api/src/reservations/reservations.service.ts`

```typescript
import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { ExpertLevelsService } from '../expert-levels/expert-levels.service';
import { ExpertStatsService } from '../experts/expert-stats.service'; // 🆕 추가
import { ulid } from 'ulid';

@Injectable()
export class ReservationsService {
  constructor(
    private prisma: PrismaService,
    private creditsService: CreditsService,
    private expertLevelsService: ExpertLevelsService,
    private expertStatsService: ExpertStatsService // 🆕 추가
  ) {}

  // ... 기존 메서드들 ...

  /**
   * ✅ 수정: confirmReservation 대신 기존 approve 메서드 사용
   * 예약 승인 시 응답시간 통계 업데이트
   */
  async approve(displayId: string, expertId: number) {
    const reservation = await this.findAndValidateExpertOwnership(displayId, expertId);

    if (reservation.status !== 'PENDING') {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'E_INVALID_STATUS',
          message: `예약 상태가 PENDING이 아닙니다. 현재 상태: ${reservation.status}`
        }
      });
    }

    // 트랜잭션: 예약 승인 + 히스토리 기록
    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. 예약 승인
      const result = await tx.reservation.update({
        where: { displayId },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
          updatedAt: new Date()
        },
        select: {
          id: true,
          displayId: true,
          userId: true,
          expertId: true,
          startAt: true,
          endAt: true,
          status: true,
          cost: true,
          confirmedAt: true
        }
      });

      // 2. 히스토리 기록
      await tx.reservationHistory.create({
        data: {
          reservationId: result.id,
          fromStatus: reservation.status,
          toStatus: 'CONFIRMED',
          changedBy: expertId,
          reason: '전문가가 예약을 승인했습니다'
        }
      });

      return result;
    });

    // 🆕 트랜잭션 완료 후 응답시간 통계 업데이트 (비동기)
    this.expertStatsService.calculateAndUpdateResponseTime(expertId)
      .catch(err => {
        console.error('[ReservationsService] 응답시간 계산 실패:', err);
      });

    return updated;
  }

  // ... 나머지 메서드들 ...
}
```

---

### Phase 4: API 엔드포인트 추가

#### 4.1 전문가 통계 조회 엔드포인트

**파일**: `apps/api/src/experts/experts.controller.ts`

```typescript
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ExpertsService } from './experts.service';
import { ExpertStatsService } from './expert-stats.service'; // 🆕 추가
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// ... 기타 imports

@Controller('experts')
export class ExpertsController {
  constructor(
    private expertsService: ExpertsService,
    private expertStatsService: ExpertStatsService // 🆕 추가
  ) {}

  // ... 기존 엔드포인트들 ...

  /**
   * 🆕 전문가 응답시간 통계 조회
   */
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
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExpertStatsService } from './expert-stats.service'; // 🆕 추가
import { ExpertLevelsService } from '../expert-levels/expert-levels.service';
// ... 기타 imports

@Injectable()
export class ExpertsService {
  constructor(
    private prisma: PrismaService,
    private expertLevelsService: ExpertLevelsService,
    private expertStatsService: ExpertStatsService // 🆕 추가
  ) {}

  // ... 기존 메서드들 ...

  async findByDisplayId(displayId: string) {
    const expert = await this.prisma.expert.findUnique({
      where: { displayId },
      include: {
        // ... 기존 include 설정
        categoryLinks: {
          include: {
            category: {
              select: {
                nameKo: true,
                nameEn: true,
                slug: true,
              }
            }
          }
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        }
        // ... 기타 includes
      }
    });

    if (!expert) {
      throw new NotFoundException(`전문가를 찾을 수 없습니다: ${displayId}`);
    }

    // 🆕 응답시간 포맷팅 추가
    const formattedResponseTime = expert.avgResponseTimeMinutes
      ? this.expertStatsService.formatResponseTime(expert.avgResponseTimeMinutes)
      : expert.responseTime;

    return {
      ...expert,
      responseTime: formattedResponseTime, // 계산된 값 또는 수동 값
      responseTimeStats: {
        avgMinutes: expert.avgResponseTimeMinutes,
        calculatedAt: expert.responseTimeCalculatedAt,
        sampleSize: expert.responseTimeSampleSize,
        isCalculated: expert.avgResponseTimeMinutes !== null
      }
    };
  }

  // ... 나머지 메서드들 ...
}
```

---

### Phase 5: 프론트엔드 업데이트

#### 5.1 ExpertProfileDetail 컴포넌트 수정

**파일**: `apps/web/src/components/experts/ExpertProfileDetail.tsx`

**위치**: Line 579 근처

```typescript
{/* 기존 코드 */}
<div className="flex items-center">
  <Clock className="h-4 w-4 mr-1" />
  <span>{(expertData as any).responseTime || "2시간 내"} 응답</span>
</div>

{/* ✅ 개선된 코드 */}
<div className="flex items-center">
  <Clock className="h-4 w-4 mr-1" />
  <span>
    {(expertData as any).responseTime || "2시간 내"} 응답
  </span>
  {(expertData as any).responseTimeStats?.isCalculated && (
    <span
      className="ml-2 text-xs text-gray-500"
      title={`최근 ${(expertData as any).responseTimeStats.sampleSize}건 응답 기준`}
    >
      (실제 데이터)
    </span>
  )}
</div>
```

#### 5.2 응답시간 통계 표시 (선택사항)

전문가 프로필 사이드바에 상세 통계 추가 (전문가 본인만 볼 수 있도록):

```tsx
{/* 🆕 응답시간 상세 정보 (전문가 본인만 볼 수 있도록) */}
{isOwner && (expertData as any).responseTimeStats?.isCalculated && (
  <div className="bg-blue-50 p-3 rounded-lg mt-4">
    <h4 className="text-sm font-semibold text-blue-900 mb-2">📊 응답시간 통계</h4>
    <div className="space-y-1 text-xs text-blue-700">
      <div className="flex justify-between">
        <span>평균 응답시간</span>
        <span className="font-medium">
          {Math.floor((expertData as any).responseTimeStats.avgMinutes / 60)}시간 {(expertData as any).responseTimeStats.avgMinutes % 60}분
        </span>
      </div>
      <div className="flex justify-between">
        <span>응답 샘플 수</span>
        <span className="font-medium">
          {(expertData as any).responseTimeStats.sampleSize}건
        </span>
      </div>
      {(expertData as any).responseTimeStats.calculatedAt && (
        <div className="flex justify-between">
          <span>마지막 계산</span>
          <span className="font-medium">
            {new Date((expertData as any).responseTimeStats.calculatedAt).toLocaleDateString('ko-KR')}
          </span>
        </div>
      )}
      <div className="mt-2 pt-2 border-t border-blue-200 text-xs text-blue-600">
        💡 빠른 응답으로 더 많은 상담 기회를 얻으세요!
      </div>
    </div>
  </div>
)}
```

---

### Phase 6: 백그라운드 작업 (선택사항)

주기적으로 모든 전문가의 응답시간을 재계산하는 스케줄 작업:

**파일**: `apps/api/src/experts/expert-stats.scheduler.ts` (🆕 신규 생성)

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ExpertStatsService } from './expert-stats.service';

@Injectable()
export class ExpertStatsScheduler {
  private readonly logger = new Logger(ExpertStatsScheduler.name);

  constructor(
    private prisma: PrismaService,
    private expertStatsService: ExpertStatsService
  ) {}

  /**
   * 매일 새벽 3시에 모든 활성 전문가의 응답시간 재계산
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async recalculateAllResponseTimes() {
    this.logger.log('🔄 전문가 응답시간 일괄 재계산 시작...');
    const startTime = Date.now();

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
        this.logger.error(`❌ 전문가 ${expert.displayId} 응답시간 계산 실패:`, error);
        errorCount++;
      }
    }

    const duration = Date.now() - startTime;
    this.logger.log(
      `✅ 응답시간 재계산 완료: 성공 ${successCount}, 실패 ${errorCount}, 소요시간 ${duration}ms`
    );
  }
}
```

**의존성 설치**:

```bash
cd apps/api
npm install @nestjs/schedule
```

**파일**: `apps/api/src/experts/experts.module.ts` (SchedulerModule 추가)

```typescript
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule'; // 🆕 추가
import { ExpertsService } from './experts.service';
import { ExpertsController } from './experts.controller';
import { ExpertStatsService } from './expert-stats.service';
import { ExpertStatsScheduler } from './expert-stats.scheduler'; // 🆕 추가
import { AuthModule } from '../auth/auth.module';
import { ExpertLevelsModule } from '../expert-levels/expert-levels.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ExpertLevelsModule,
    ScheduleModule.forRoot() // 🆕 스케줄러 활성화
  ],
  controllers: [ExpertsController],
  providers: [
    ExpertsService,
    ExpertStatsService,
    ExpertStatsScheduler // 🆕 추가
  ],
  exports: [
    ExpertsService,
    ExpertStatsService
  ]
})
export class ExpertsModule {}
```

---

## 📝 구현 체크리스트

### Backend

- [ ] 1. Prisma schema에 필드 추가 및 인덱스 설정
- [ ] 2. 마이그레이션 생성 및 실행
- [ ] 3. `ExpertStatsService` 생성
  - [ ] `calculateAndUpdateResponseTime()` - 정확한 가중평균 로직
  - [ ] `formatResponseTime()` - 시간 포맷팅
  - [ ] `getResponseTimeStats()` - 통계 조회
- [ ] 4. `ExpertsModule` 수정
  - [ ] PrismaModule import 추가
  - [ ] ExpertStatsService provider 추가
  - [ ] ExpertStatsService export 추가
  - [ ] ScheduleModule.forRoot() 추가
- [ ] 5. `InquiryModule` 수정
  - [ ] ExpertsModule import 추가
- [ ] 6. `InquiryService` 수정
  - [ ] ExpertStatsService 의존성 주입
  - [ ] createReply() 메서드에 통계 업데이트 추가
- [ ] 7. `ReservationsModule` 수정
  - [ ] ExpertsModule import 추가
- [ ] 8. `ReservationsService` 수정
  - [ ] ExpertStatsService 의존성 주입
  - [ ] approve() 메서드에 통계 업데이트 추가
- [ ] 9. `ExpertsController` 수정
  - [ ] ExpertStatsService 의존성 주입
  - [ ] GET /experts/:displayId/stats/response-time 엔드포인트 추가
- [ ] 10. `ExpertsService` 수정
  - [ ] ExpertStatsService 의존성 주입
  - [ ] findByDisplayId()에 응답시간 통계 포함
- [ ] 11. (선택) `ExpertStatsScheduler` 생성
- [ ] 12. (선택) @nestjs/schedule 패키지 설치

### Frontend

- [ ] 13. `ExpertProfileDetail` 수정
  - [ ] 응답시간 표시 개선
  - [ ] "실제 데이터" 인디케이터 추가
- [ ] 14. (선택) 전문가용 응답시간 통계 대시보드

### Testing

- [ ] 15. 문의 답변 후 응답시간 자동 업데이트 테스트
- [ ] 16. 예약 승인 후 응답시간 자동 업데이트 테스트
- [ ] 17. 샘플 데이터 부족 시 fallback 동작 테스트
- [ ] 18. 가중평균 계산 정확성 검증
- [ ] 19. 이상치 필터링 테스트 (14일 초과 응답)
- [ ] 20. API 엔드포인트 응답 형식 검증
- [ ] 21. 모듈 의존성 순환 참조 검증

---

## 🔧 기술적 고려사항

### 성능 최적화

1. **인덱스 전략**
   - `Expert.avgResponseTimeMinutes` 인덱스 추가
   - `Inquiry(expertId, createdAt)` 복합 인덱스
   - `Reservation(expertId, createdAt, status)` 복합 인덱스

2. **쿼리 최적화**
   - 최근 30일 데이터만 조회 (인덱스 활용)
   - 비동기 실행으로 메인 작업 블로킹 방지
   - 트랜잭션 완료 후 통계 업데이트 (데이터 정합성)

3. **에러 처리**
   - 실패해도 메인 기능에 영향 없도록 try-catch
   - 적절한 로깅 (console.error → Logger 사용 권장)

### 데이터 품질

1. **통계적 신뢰도**
   - 최소 3개 샘플 필요
   - 이상치 제거 (14일 초과 응답 제외)
   - 정확한 가중평균 계산 (문의 70%, 예약 30%)

2. **데이터 무결성**
   - status가 CONFIRMED인 예약만 집계
   - reply가 있는 inquiry만 집계
   - 음수 시간 및 0분 응답 제외

### 호환성

1. **하위 호환성**
   - 기존 `responseTime` 필드 유지 (수동 설정 가능)
   - 계산된 값이 없으면 수동 값으로 fallback
   - 점진적 마이그레이션 가능

2. **모듈 의존성**
   - 명확한 의존성 방향: InquiryModule, ReservationsModule → ExpertsModule
   - 순환 참조 없음 확인
   - 올바른 import/export 설정

---

## 📈 예상 효과

1. **신뢰도 향상**: 실제 데이터 기반 정보 제공
2. **투명성 증대**: 계산 근거와 샘플 수 표시
3. **전문가 동기부여**: 빠른 응답 유도
4. **사용자 경험**: 정확한 기대치 설정
5. **플랫폼 품질**: 데이터 기반 품질 관리

---

## 🚀 배포 계획

### 1단계: 개발 환경 테스트
- 마이그레이션 실행 및 검증
- 기능 테스트 (문의, 예약 응답 후 자동 계산)
- 가중평균 계산 정확성 검증
- 에지 케이스 테스트

### 2단계: 스테이징 배포
- 실제 유사 데이터로 동작 확인
- 성능 모니터링 (쿼리 실행 시간)
- API 응답 형식 검증

### 3단계: 프로덕션 배포
- **Step 1**: 백엔드 스키마 및 서비스 배포
- **Step 2**: API 엔드포인트 활성화
- **Step 3**: 프론트엔드 UI 업데이트
- **Step 4**: (선택) 백그라운드 스케줄러 활성화
- **Step 5**: 모니터링 및 피드백 수집

---

## 🔍 주요 수정 사항 요약

| 항목 | 원본 | 수정본 | 이유 |
|------|------|--------|------|
| **모듈 의존성** | PrismaModule 누락 | PrismaModule 추가 | ExpertStatsService에서 사용 |
| **모듈 exports** | exports 배열 없음 | exports 배열 추가 | 다른 모듈에서 사용 가능 |
| **InquiryModule** | imports 2개 | ExpertsModule 추가 | ExpertStatsService 의존성 |
| **ReservationsModule** | imports 2개 | ExpertsModule 추가 | ExpertStatsService 의존성 |
| **예약 메서드명** | confirmReservation() | approve() | 실제 메서드명과 일치 |
| **가중평균 계산** | 배열 중복 방식 | 수학적 가중평균 공식 | 정확한 통계 계산 |
| **ExpertsService** | ExpertStatsService 미주입 | constructor에 주입 추가 | 의존성 주입 필요 |
| **예외 처리** | throw new Error() | NotFoundException | NestJS 표준 |
| **샘플 크기** | 가중치 적용된 수 | 실제 응답 수 | 명확한 통계 표시 |
| **성능 최적화** | 인덱스 미언급 | 인덱스 추가 명시 | 쿼리 성능 개선 |
| **통합 시점** | 불명확 | 트랜잭션 완료 후 | 데이터 정합성 |

---

## 📚 참고 문서

- Prisma Schema: `apps/api/prisma/schema.prisma`
- Inquiry Service: `apps/api/src/inquiry/inquiry.service.ts`
- Reservations Service: `apps/api/src/reservations/reservations.service.ts`
- Experts Service: `apps/api/src/experts/experts.service.ts`
- Expert Profile: `apps/web/src/components/experts/ExpertProfileDetail.tsx`

---

**작성일**: 2025-01-26
**수정일**: 2025-01-26
**작성자**: Claude Code Analysis
**상태**: 검토 완료 - 구현 준비 완료
