# 전문가 알림 이메일 구현 계획

## 📋 개요

클라이언트가 문의(Inquiry) 또는 상담예약(Reservation)을 신청할 때 전문가에게 이메일 알림을 보내서 빠른 응답을 유도하는 기능을 구현합니다.

## 🎯 목표

1. 문의 생성 시 전문가에게 즉시 이메일 알림
2. 예약 생성 시 전문가에게 즉시 이메일 알림
3. 기존 인증 이메일과 동일한 스타일 (인라인 CSS, 2-column 레이아웃)
4. 빠른 응답을 위한 명확한 CTA 버튼

## 📊 현재 시스템 분석

### 메일 시스템 구조
- **파일**: `apps/api/src/mail/mail.service.ts`
- **메서드**: `sendMail(to, subject, html, text)`
- **프로바이더**: SMTP 또는 AWS SES
- **기존 템플릿**:
  - `sendVerificationEmail()` - 회원가입 인증 (line 182-268)
  - `sendPasswordResetEmail()` - 비밀번호 재설정 (line 271-394)
  - `sendExpertApplicationStatusEmail()` - 전문가 신청 결과 (line 397-546)
  - `sendAdditionalInfoRequestEmail()` - 추가 정보 요청 (line 549-657)

### 문의 생성 지점
- **파일**: `apps/api/src/inquiry/inquiry.service.ts`
- **메서드**: `createInquiry(clientId, dto)` (line 18-45)
- **반환값**: 생성된 문의 정보 (expert 정보 포함)

### 예약 생성 지점
- **파일**: `apps/api/src/reservations/reservations.service.ts`
- **메서드**: `create(dto)` (line 17-150)
- **반환값**: 생성된 예약 정보 (displayId, userId, expertId, startAt, endAt, cost, status)

### 전문가 이메일 조회
- **스키마**: Expert → User (1:1 관계)
- **Expert.userId** → **User.email**
```typescript
const expert = await this.prisma.expert.findUnique({
  where: { id: expertId },
  include: { user: { select: { email: true, name: true } } }
});
const expertEmail = expert.user?.email;
```

## 🏗️ 구현 단계

### Phase 1: MailService에 새 이메일 템플릿 메서드 추가

**파일**: `apps/api/src/mail/mail.service.ts`

#### 1-1. 새 문의 알림 이메일
```typescript
async sendNewInquiryNotification(
  expertEmail: string,
  expertName: string,
  clientName: string,
  inquirySubject: string,
  inquiryContent: string,
  inquiryId: string,
  category: string
)
```

**이메일 내용**:
- **제목**: `[Consult-On] 새로운 문의가 도착했습니다`
- **메인 메시지**: 클라이언트로부터 새 문의 도착
- **정보 표시**:
  - 클라이언트 이름
  - 문의 제목
  - 문의 내용 (처음 200자)
  - 문의 카테고리
  - 문의 ID
- **CTA 버튼**: "문의 확인하기" → 전문가 대시보드 문의 페이지
- **강조 메시지**: "빠른 응답이 고객 만족도를 높입니다"

#### 1-2. 새 예약 요청 알림 이메일
```typescript
async sendNewReservationNotification(
  expertEmail: string,
  expertName: string,
  clientName: string,
  reservationDisplayId: string,
  startAt: Date,
  endAt: Date,
  note: string | null,
  cost: number
)
```

**이메일 내용**:
- **제목**: `[Consult-On] 새로운 상담 예약 요청이 도착했습니다`
- **메인 메시지**: 클라이언트로부터 새 예약 요청
- **정보 표시**:
  - 클라이언트 이름
  - 예약 일시 (시작 ~ 종료)
  - 예약 시간 (분)
  - 예약 금액 (크레딧)
  - 요청 사항 (note)
  - 예약 번호 (displayId)
- **CTA 버튼**: "예약 확인하기" → 전문가 대시보드 예약 페이지
- **강조 메시지**: "24시간 내 승인/거절이 필요합니다"

### Phase 2: InquiryService 수정

**파일**: `apps/api/src/inquiry/inquiry.service.ts`

#### 2-1. MailService 주입
```typescript
constructor(
  private prisma: PrismaService,
  private expertStatsService: ExpertStatsService,
  private mailService: MailService  // 추가
) {}
```

#### 2-2. createInquiry 메서드 수정
```typescript
async createInquiry(clientId: number, dto: CreateInquiryDto) {
  // 기존 코드: expert 조회
  const expert = await this.prisma.expert.findUnique({
    where: { id: dto.expertId },
    include: {
      user: { select: { email: true, name: true } }  // user 정보 추가
    }
  });

  if (!expert) {
    throw new NotFoundException('전문가를 찾을 수 없습니다.');
  }

  // 클라이언트 정보 조회
  const client = await this.prisma.user.findUnique({
    where: { id: clientId },
    select: { name: true }
  });

  // 기존 코드: 문의 생성
  const inquiry = await this.prisma.inquiry.create({
    data: {
      clientId,
      expertId: dto.expertId,
      subject: dto.subject,
      content: dto.content,
      category: prismaCategory
    },
    include: {
      expert: {
        select: { id: true, name: true, avatarUrl: true, title: true }
      }
    }
  });

  // ✅ 새로운 코드: 전문가에게 이메일 알림 (비동기, non-blocking)
  if (expert.user?.email) {
    this.mailService
      .sendNewInquiryNotification(
        expert.user.email,
        expert.name,
        client?.name || '고객',
        dto.subject,
        dto.content,
        inquiry.id,
        dto.category
      )
      .catch(err => {
        console.error('[InquiryService] 문의 알림 이메일 발송 실패:', err);
      });
  }

  return this.formatInquiryResponse(inquiry, 'client');
}
```

### Phase 3: ReservationsService 수정

**파일**: `apps/api/src/reservations/reservations.service.ts`

#### 3-1. MailService 주입
```typescript
constructor(
  private prisma: PrismaService,
  private creditsService: CreditsService,
  private expertLevelsService: ExpertLevelsService,
  private expertStatsService: ExpertStatsService,
  private mailService: MailService  // 추가
) {}
```

#### 3-2. create 메서드 수정
```typescript
async create(dto: { userId: number; expertId: number; startAt: string; endAt: string; note?: string }) {
  // ... 기존 validation 및 계산 로직 ...

  // 전문가 정보 조회 (user 포함)
  const expert = await this.prisma.expert.findUnique({
    where: { id: dto.expertId },
    include: {
      user: { select: { email: true, name: true } }
    },
    select: {
      hourlyRate: true,
      totalSessions: true,
      ratingAvg: true,
      experience: true,
      reviewCount: true,
      repeatClients: true,
      name: true,
      user: true
    }
  });

  // 클라이언트 정보 조회
  const client = await this.prisma.user.findUnique({
    where: { id: dto.userId },
    select: { name: true }
  });

  // ... 기존 트랜잭션 로직 ...

  const result = await this.prisma.$transaction(async (tx) => {
    // ... 예약 생성 및 크레딧 차감 ...
    return created;
  });

  // ✅ 새로운 코드: 전문가에게 이메일 알림 (비동기, non-blocking)
  if (expert.user?.email) {
    this.mailService
      .sendNewReservationNotification(
        expert.user.email,
        expert.name,
        client?.name || '고객',
        result.displayId,
        result.startAt,
        result.endAt,
        dto.note || null,
        result.cost
      )
      .catch(err => {
        console.error('[ReservationsService] 예약 알림 이메일 발송 실패:', err);
      });
  }

  return result;
}
```

### Phase 4: InquiryModule 및 ReservationsModule 수정

#### 4-1. InquiryModule에 MailModule import
**파일**: `apps/api/src/inquiry/inquiry.module.ts`
```typescript
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [PrismaModule, ExpertsModule, MailModule],  // MailModule 추가
  providers: [InquiryService],
  controllers: [InquiryController],
  exports: [InquiryService]
})
export class InquiryModule {}
```

#### 4-2. ReservationsModule에 MailModule import
**파일**: `apps/api/src/reservations/reservations.module.ts`
```typescript
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    PrismaModule,
    CreditsModule,
    ExpertLevelsModule,
    ExpertsModule,
    MailModule  // 추가
  ],
  providers: [ReservationsService],
  controllers: [ReservationsController],
  exports: [ReservationsService]
})
export class ReservationsModule {}
```

## 🎨 이메일 템플릿 디자인

### 공통 스타일 (기존 템플릿 기반)
- **레이아웃**: 2-column (왼쪽: 헤더/브랜드, 오른쪽: 콘텐츠)
- **폰트**: Pretendard, Apple SD Gothic Neo, Malgun Gothic
- **배경색**: #f8fafc (밝은 회색)
- **카드**: white (#ffffff), border-radius: 16px, box-shadow
- **반응형**: max-width: 800px

### 문의 알림 이메일 디자인
```
┌─────────────────────────────────────────┐
│ [왼쪽: 파란색 gradient 배경]            │
│  Consult-On                             │
│  새로운 문의가                          │
│  도착했습니다                           │
│                                         │
│ [오른쪽: 메인 콘텐츠]                   │
│  📩 새로운 문의                         │
│  안녕하세요, {expertName}님!            │
│                                         │
│  [연한 파란색 박스]                     │
│  클라이언트: {clientName}               │
│  카테고리: {category}                   │
│  제목: {subject}                        │
│                                         │
│  [회색 박스 - 내용 미리보기]            │
│  {content 처음 200자...}                │
│                                         │
│  [강조 박스]                            │
│  💡 빠른 응답이 고객 만족도를 높입니다  │
│                                         │
│  [CTA 버튼: 파란색]                     │
│  문의 확인하기 →                        │
│                                         │
│  [회색 박스]                            │
│  문의 ID: {inquiryId}                   │
└─────────────────────────────────────────┘
```

### 예약 알림 이메일 디자인
```
┌─────────────────────────────────────────┐
│ [왼쪽: 초록색 gradient 배경]            │
│  Consult-On                             │
│  새로운 예약 요청이                     │
│  도착했습니다                           │
│                                         │
│ [오른쪽: 메인 콘텐츠]                   │
│  🗓 새로운 예약 요청                    │
│  안녕하세요, {expertName}님!            │
│                                         │
│  [연한 초록색 박스]                     │
│  클라이언트: {clientName}               │
│  예약 일시: {startAt} ~ {endAt}         │
│  예약 시간: {duration}분                │
│  예약 금액: {cost} 크레딧               │
│                                         │
│  [회색 박스 - 요청사항]                 │
│  요청사항: {note}                       │
│                                         │
│  [강조 박스 - 주황색]                   │
│  ⏰ 24시간 내 승인/거절이 필요합니다    │
│                                         │
│  [CTA 버튼: 초록색]                     │
│  예약 확인하기 →                        │
│                                         │
│  [회색 박스]                            │
│  예약 번호: {displayId}                 │
└─────────────────────────────────────────┘
```

## 🔍 세부 구현 코드

### 문의 알림 이메일 템플릿 (mail.service.ts)
```typescript
async sendNewInquiryNotification(
  expertEmail: string,
  expertName: string,
  clientName: string,
  inquirySubject: string,
  inquiryContent: string,
  inquiryId: string,
  category: string
) {
  const subject = '[Consult-On] 새로운 문의가 도착했습니다';

  // 내용 미리보기 (200자 제한)
  const contentPreview = inquiryContent.length > 200
    ? inquiryContent.substring(0, 200) + '...'
    : inquiryContent;

  // 카테고리 한글 변환
  const categoryMap: Record<string, string> = {
    'general': '일반 문의',
    'technical': '기술 문의',
    'pricing': '가격 문의',
    'scheduling': '일정 문의',
    'other': '기타'
  };
  const categoryKo = categoryMap[category] || category;

  const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard/expert/inquiries`;

  const html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>새로운 문의</title>
    </head>
    <body style="font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; line-height: 1.5; color: #1f2937; margin: 0; padding: 20px; background-color: #f8fafc;">
      <div style="max-width: 800px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">

        <!-- Header & Content Wrapper -->
        <div style="display: flex; align-items: stretch;">

          <!-- Left Side: Header -->
          <div style="background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%); padding: 40px 30px; width: 280px;">
            <h1 style="font-size: 28px; font-weight: 700; color: #ffffff; margin: 0 0 16px 0; letter-spacing: -0.5px; white-space: nowrap;">Consult-On</h1>
            <p style="font-size: 14px; color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.6;">새로운 문의가<br/>도착했습니다</p>
          </div>

          <!-- Right Side: Main Content -->
          <div style="flex: 1; padding: 40px 35px;">

            <!-- Title -->
            <h2 style="font-size: 20px; font-weight: 600; color: #1e293b; margin: 0 0 8px 0;">📩 새로운 문의</h2>
            <p style="color: #64748b; margin: 0 0 24px 0; font-size: 14px; line-height: 1.6;">안녕하세요, ${expertName}님!</p>

            <!-- Inquiry Info -->
            <div style="background: #eff6ff; border: 2px solid #bfdbfe; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
              <div style="margin-bottom: 12px;">
                <span style="font-size: 11px; font-weight: 600; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px;">클라이언트</span>
                <div style="font-size: 15px; font-weight: 600; color: #1e293b; margin-top: 4px;">${clientName}</div>
              </div>
              <div style="margin-bottom: 12px;">
                <span style="font-size: 11px; font-weight: 600; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px;">카테고리</span>
                <div style="font-size: 14px; color: #475569; margin-top: 4px;">${categoryKo}</div>
              </div>
              <div>
                <span style="font-size: 11px; font-weight: 600; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px;">제목</span>
                <div style="font-size: 14px; color: #475569; margin-top: 4px; font-weight: 500;">${inquirySubject}</div>
              </div>
            </div>

            <!-- Content Preview -->
            <div style="background: #f8fafc; border-left: 3px solid #cbd5e1; border-radius: 4px; padding: 16px 20px; margin-bottom: 20px;">
              <p style="font-size: 11px; font-weight: 600; color: #64748b; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">문의 내용</p>
              <p style="color: #475569; margin: 0; font-size: 13px; line-height: 1.6;">${contentPreview}</p>
            </div>

            <!-- Response Reminder -->
            <div style="background: #fef3c7; border-left: 3px solid #fbbf24; border-radius: 4px; padding: 16px 20px; margin-bottom: 24px;">
              <div style="display: flex; align-items: flex-start; gap: 8px;">
                <span style="color: #f59e0b; font-size: 14px;">💡</span>
                <p style="color: #92400e; margin: 0; font-size: 13px; line-height: 1.5; font-weight: 500;">빠른 응답이 고객 만족도를 높입니다</p>
              </div>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 24px 0;">
              <a href="${dashboardUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                문의 확인하기 →
              </a>
            </div>

            <!-- Inquiry ID -->
            <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-top: 20px;">
              <p style="font-size: 11px; font-weight: 600; color: #64748b; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px;">문의 ID</p>
              <div style="font-size: 16px; font-weight: 700; color: #1e293b; font-family: 'SF Mono', 'Monaco', 'Consolas', monospace; margin: 0;">${inquiryId}</div>
            </div>

          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 20px 35px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">본 메일은 발신 전용입니다 · © 2024 Consult-On. All rights reserved.</p>
        </div>

      </div>
    </body>
    </html>
  `;

  const text = `
[Consult-On] 새로운 문의

안녕하세요, ${expertName}님!

클라이언트 ${clientName}님으로부터 새로운 문의가 도착했습니다.

카테고리: ${categoryKo}
제목: ${inquirySubject}

문의 내용:
${contentPreview}

💡 빠른 응답이 고객 만족도를 높입니다

문의 확인하기: ${dashboardUrl}

문의 ID: ${inquiryId}

© 2024 Consult-On. All rights reserved.
  `;

  return this.sendMail(expertEmail, subject, html, text);
}
```

### 예약 알림 이메일 템플릿 (mail.service.ts)
```typescript
async sendNewReservationNotification(
  expertEmail: string,
  expertName: string,
  clientName: string,
  reservationDisplayId: string,
  startAt: Date,
  endAt: Date,
  note: string | null,
  cost: number
) {
  const subject = '[Consult-On] 새로운 상담 예약 요청이 도착했습니다';

  // 날짜 포맷팅
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
  };

  const startFormatted = formatDate(startAt);
  const endFormatted = formatDate(endAt);

  // 예약 시간 계산 (분)
  const durationMinutes = Math.ceil((endAt.getTime() - startAt.getTime()) / 60000);

  const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard/expert/reservations`;

  const html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>새로운 예약 요청</title>
    </head>
    <body style="font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; line-height: 1.5; color: #1f2937; margin: 0; padding: 20px; background-color: #f8fafc;">
      <div style="max-width: 800px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">

        <!-- Header & Content Wrapper -->
        <div style="display: flex; align-items: stretch;">

          <!-- Left Side: Header -->
          <div style="background: linear-gradient(180deg, #10b981 0%, #059669 100%); padding: 40px 30px; width: 280px;">
            <h1 style="font-size: 28px; font-weight: 700; color: #ffffff; margin: 0 0 16px 0; letter-spacing: -0.5px; white-space: nowrap;">Consult-On</h1>
            <p style="font-size: 14px; color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.6;">새로운 예약 요청이<br/>도착했습니다</p>
          </div>

          <!-- Right Side: Main Content -->
          <div style="flex: 1; padding: 40px 35px;">

            <!-- Title -->
            <h2 style="font-size: 20px; font-weight: 600; color: #1e293b; margin: 0 0 8px 0;">🗓 새로운 예약 요청</h2>
            <p style="color: #64748b; margin: 0 0 24px 0; font-size: 14px; line-height: 1.6;">안녕하세요, ${expertName}님!</p>

            <!-- Reservation Info -->
            <div style="background: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
              <div style="margin-bottom: 12px;">
                <span style="font-size: 11px; font-weight: 600; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">클라이언트</span>
                <div style="font-size: 15px; font-weight: 600; color: #1e293b; margin-top: 4px;">${clientName}</div>
              </div>
              <div style="margin-bottom: 12px;">
                <span style="font-size: 11px; font-weight: 600; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">예약 일시</span>
                <div style="font-size: 14px; color: #475569; margin-top: 4px;">${startFormatted}</div>
                <div style="font-size: 14px; color: #475569;">~ ${endFormatted}</div>
              </div>
              <div style="margin-bottom: 12px;">
                <span style="font-size: 11px; font-weight: 600; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">예약 시간</span>
                <div style="font-size: 14px; color: #475569; margin-top: 4px; font-weight: 600;">${durationMinutes}분</div>
              </div>
              <div>
                <span style="font-size: 11px; font-weight: 600; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">예약 금액</span>
                <div style="font-size: 16px; color: #10b981; margin-top: 4px; font-weight: 700;">${cost.toLocaleString()} 크레딧</div>
              </div>
            </div>

            ${note ? `
              <!-- Note -->
              <div style="background: #f8fafc; border-left: 3px solid #cbd5e1; border-radius: 4px; padding: 16px 20px; margin-bottom: 20px;">
                <p style="font-size: 11px; font-weight: 600; color: #64748b; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">요청 사항</p>
                <p style="color: #475569; margin: 0; font-size: 13px; line-height: 1.6;">${note}</p>
              </div>
            ` : ''}

            <!-- Approval Reminder -->
            <div style="background: #fff7ed; border-left: 3px solid #fb923c; border-radius: 4px; padding: 16px 20px; margin-bottom: 24px;">
              <div style="display: flex; align-items: flex-start; gap: 8px;">
                <span style="color: #ea580c; font-size: 14px;">⏰</span>
                <p style="color: #9a3412; margin: 0; font-size: 13px; line-height: 1.5; font-weight: 500;">24시간 내 승인/거절이 필요합니다</p>
              </div>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 24px 0;">
              <a href="${dashboardUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                예약 확인하기 →
              </a>
            </div>

            <!-- Reservation ID -->
            <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-top: 20px;">
              <p style="font-size: 11px; font-weight: 600; color: #64748b; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px;">예약 번호</p>
              <div style="font-size: 16px; font-weight: 700; color: #1e293b; font-family: 'SF Mono', 'Monaco', 'Consolas', monospace; margin: 0;">${reservationDisplayId}</div>
            </div>

          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 20px 35px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">본 메일은 발신 전용입니다 · © 2024 Consult-On. All rights reserved.</p>
        </div>

      </div>
    </body>
    </html>
  `;

  const text = `
[Consult-On] 새로운 상담 예약 요청

안녕하세요, ${expertName}님!

클라이언트 ${clientName}님으로부터 새로운 예약 요청이 도착했습니다.

예약 일시: ${startFormatted} ~ ${endFormatted}
예약 시간: ${durationMinutes}분
예약 금액: ${cost.toLocaleString()} 크레딧

${note ? `요청 사항: ${note}\n` : ''}
⏰ 24시간 내 승인/거절이 필요합니다

예약 확인하기: ${dashboardUrl}

예약 번호: ${reservationDisplayId}

© 2024 Consult-On. All rights reserved.
  `;

  return this.sendMail(expertEmail, subject, html, text);
}
```

## ✅ 검증 및 테스트

### 테스트 시나리오

#### 1. 문의 생성 테스트
1. 클라이언트로 로그인
2. 전문가 프로필에서 "문의하기" 클릭
3. 문의 제목, 내용 작성 후 전송
4. **예상 결과**:
   - 문의가 DB에 생성됨
   - 전문가의 이메일로 알림 발송
   - 로그에 이메일 발송 성공/실패 메시지 출력

#### 2. 예약 생성 테스트
1. 클라이언트로 로그인
2. 전문가 프로필에서 "상담 예약하기" 클릭
3. 예약 일시 선택 후 요청
4. **예상 결과**:
   - 예약이 DB에 생성됨 (PENDING 상태)
   - 크레딧이 차감됨
   - 전문가의 이메일로 알림 발송
   - 로그에 이메일 발송 성공/실패 메시지 출력

#### 3. 이메일 발송 실패 처리
1. 잘못된 이메일 주소 설정
2. 문의 또는 예약 생성
3. **예상 결과**:
   - 문의/예약은 정상 생성됨
   - 로그에 이메일 발송 실패 에러 출력
   - 서비스는 정상 동작 (이메일 실패가 전체 프로세스를 중단하지 않음)

### 모니터링 포인트
- 이메일 발송 성공률
- 이메일 발송 실패 원인 (SMTP 에러, SES 에러 등)
- 전문가의 평균 응답 시간 개선 여부
- 이메일 오픈율 (SES 사용 시)

## 🚀 배포 전 체크리스트

- [ ] MailService에 2개 메서드 추가 완료
- [ ] InquiryModule에 MailModule import 완료
- [ ] InquiryService에서 이메일 발송 로직 추가 완료
- [ ] ReservationsModule에 MailModule import 완료
- [ ] ReservationsService에서 이메일 발송 로직 추가 완료
- [ ] 이메일 템플릿 HTML/CSS 검증 완료
- [ ] 로컬 환경에서 SMTP 테스트 완료
- [ ] 에러 핸들링 로직 검증 완료
- [ ] 로그 출력 확인 완료
- [ ] 프로덕션 환경변수 설정 확인 (FRONTEND_URL, SMTP/SES 설정)

## 📝 추가 개선사항 (향후)

1. **이메일 템플릿 관리**
   - 템플릿을 별도 파일로 분리
   - 템플릿 엔진 도입 (Handlebars, EJS 등)

2. **이메일 발송 이력 관리**
   - EmailNotification 테이블 생성
   - 발송 이력, 오픈율, 클릭율 추적

3. **알림 설정 기능**
   - 전문가가 이메일 알림 on/off 설정 가능
   - 알림 빈도 조절 (즉시, 1시간마다, 하루 요약 등)

4. **다국어 지원**
   - 영어/한국어 이메일 템플릿
   - 사용자 언어 설정에 따른 자동 선택

5. **푸시 알림 통합**
   - 이메일 + 앱 푸시 알림 동시 발송
   - 알림 우선순위 관리
