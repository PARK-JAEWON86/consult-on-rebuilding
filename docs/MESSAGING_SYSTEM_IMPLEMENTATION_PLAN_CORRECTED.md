# 메시징 시스템 구현 계획서 (수정본)
**작성일**: 2025-10-24
**버전**: 2.0 (MySQL 호환 수정)

---

## 🔴 이전 계획서의 문제점 및 수정 사항

### 발견된 문제
1. **데이터베이스 타입 불일치**: PostgreSQL 전용 문법 사용 → 현재 프로젝트는 MySQL
2. **ID 생성 방식**: `@default(cuid())` → MySQL 미지원
3. **Enum 대소문자 불일치**: Prisma(대문자) vs API/프론트(소문자)
4. **Expert 인증 로직 누락**: User.id에서 Expert.id를 찾는 로직 필요

### 수정 내용
✅ MySQL 호환 스키마로 변경 (`@default(uuid())` 사용)
✅ Enum 변환 로직 추가 (대소문자 자동 변환)
✅ Expert 조회 로직 추가 (userId → Expert.id)
✅ onDelete Cascade 추가 (데이터 정합성)

---

## 📋 수정된 데이터베이스 설계

### Prisma Schema

```prisma
// ==========================================
// Inquiry (문의) 모델
// ==========================================
model Inquiry {
  id          String   @id @default(uuid())  // MySQL UUID 지원

  // 관계
  clientId    Int      // User.id (문의를 보낸 클라이언트)
  client      User     @relation("ClientInquiries", fields: [clientId], references: [id], onDelete: Cascade)

  expertId    Int      // Expert.id (문의를 받은 전문가)
  expert      Expert   @relation("ExpertInquiries", fields: [expertId], references: [id], onDelete: Cascade)

  // 문의 내용
  subject     String   @db.VarChar(200) // 제목 (최대 200자)
  content     String   @db.Text         // 본문
  category    InquiryCategory          // 문의 카테고리

  // 상태 관리
  isRead      Boolean  @default(false)  // 전문가가 읽었는지

  // 답변 (1:1 관계)
  reply       InquiryReply?

  // 타임스탬프
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 인덱스 최적화
  @@index([clientId, createdAt])                    // 클라이언트 문의 조회
  @@index([expertId, isRead, createdAt])           // 전문가 읽지 않은 문의 조회
  @@index([expertId, createdAt])                   // 전문가 전체 문의 조회
}

// ==========================================
// InquiryCategory (문의 카테고리)
// ==========================================
enum InquiryCategory {
  SCHEDULE  // 상담 일정 문의
  TIME      // 상담 시간 문의
  PRICE     // 상담 비용 문의
  METHOD    // 상담 방식 문의
  OTHER     // 기타 문의
}

// ==========================================
// InquiryReply (답변) 모델
// ==========================================
model InquiryReply {
  id          String   @id @default(uuid())

  // 1:1 관계
  inquiryId   String   @unique
  inquiry     Inquiry  @relation(fields: [inquiryId], references: [id], onDelete: Cascade)

  // 답변 내용
  content     String   @db.Text

  // 타임스탬프
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ==========================================
// User 모델에 관계 추가
// ==========================================
model User {
  // ... 기존 필드들 (10~42줄)

  // Inquiry 관계 추가
  clientInquiries  Inquiry[]  @relation("ClientInquiries")
}

// ==========================================
// Expert 모델에 관계 추가
// ==========================================
model Expert {
  // ... 기존 필드들 (46~100줄)

  // Inquiry 관계 추가
  expertInquiries  Inquiry[]  @relation("ExpertInquiries")
}
```

### 마이그레이션 명령어

```bash
# 1. Schema 변경 적용
cd apps/api
npx prisma migrate dev --name add_inquiry_system

# 2. Prisma Client 재생성
npx prisma generate

# 3. 마이그레이션 확인
npx prisma migrate status

# 4. (선택) Prisma Studio로 확인
npx prisma studio
```

---

## 🔧 백엔드 API 구현

### 1. DTO 수정 (Enum 변환 처리)

**파일**: `apps/api/src/inquiry/dto/create-inquiry.dto.ts`

```typescript
import { IsNotEmpty, IsString, IsInt, IsEnum, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

// 프론트엔드는 소문자로 전송
export enum InquiryCategoryDto {
  SCHEDULE = 'schedule',
  TIME = 'time',
  PRICE = 'price',
  METHOD = 'method',
  OTHER = 'other'
}

export class CreateInquiryDto {
  @IsInt()
  expertId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  @IsEnum(InquiryCategoryDto)
  @Transform(({ value }) => value.toLowerCase()) // 소문자로 정규화
  category: InquiryCategoryDto;
}
```

### 2. Service 수정 (Expert 조회 및 Enum 변환)

**파일**: `apps/api/src/inquiry/inquiry.service.ts`

```typescript
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InquiryCategory } from '@prisma/client';

@Injectable()
export class InquiryService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // 클라이언트용 메서드
  // ==========================================

  async createInquiry(clientId: number, dto: CreateInquiryDto) {
    // 전문가 존재 확인
    const expert = await this.prisma.expert.findUnique({
      where: { id: dto.expertId }
    });

    if (!expert) {
      throw new NotFoundException('전문가를 찾을 수 없습니다.');
    }

    // Enum 변환: 소문자 → 대문자
    const prismaCategory = this.toPrismaCategory(dto.category);

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
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            title: true
          }
        }
      }
    });

    return this.formatInquiryResponse(inquiry, 'client');
  }

  async getClientInquiries(clientId: number, query: QueryInquiryDto) {
    const { status, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { clientId };

    if (status === 'unread') {
      where.isRead = false;
    } else if (status === 'replied') {
      where.reply = { isNot: null };
    }

    if (search) {
      where.OR = [
        { subject: { contains: search } },
        { content: { contains: search } }
      ];
    }

    const [inquiries, total] = await Promise.all([
      this.prisma.inquiry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          expert: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          },
          reply: true
        }
      }),
      this.prisma.inquiry.count({ where })
    ]);

    const summary = await this.getClientInquirySummary(clientId);

    return {
      inquiries: inquiries.map(inq => this.formatInquiryResponse(inq, 'client')),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      summary
    };
  }

  async getClientInquiry(clientId: number, inquiryId: string) {
    const inquiry = await this.prisma.inquiry.findFirst({
      where: { id: inquiryId, clientId },
      include: {
        expert: {
          select: {
            id: true,
            displayId: true,
            name: true,
            avatarUrl: true,
            title: true,
            specialty: true
          }
        },
        reply: true
      }
    });

    if (!inquiry) {
      throw new NotFoundException('문의를 찾을 수 없습니다.');
    }

    return this.formatInquiryResponse(inquiry, 'client');
  }

  async deleteClientInquiry(clientId: number, inquiryId: string) {
    const inquiry = await this.prisma.inquiry.findFirst({
      where: { id: inquiryId, clientId }
    });

    if (!inquiry) {
      throw new NotFoundException('문의를 찾을 수 없습니다.');
    }

    await this.prisma.inquiry.delete({
      where: { id: inquiryId }
    });

    return { message: '문의가 삭제되었습니다.' };
  }

  // ==========================================
  // 전문가용 메서드
  // ==========================================

  async getExpertInquiries(userId: number, query: QueryInquiryDto) {
    // 🔥 User ID로 Expert 찾기
    const expert = await this.prisma.expert.findUnique({
      where: { userId }
    });

    if (!expert) {
      throw new NotFoundException('전문가 프로필을 찾을 수 없습니다.');
    }

    const { status, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { expertId: expert.id };

    if (status === 'unread') {
      where.isRead = false;
    } else if (status === 'replied') {
      where.reply = { isNot: null };
    }

    if (search) {
      where.OR = [
        { subject: { contains: search } },
        { content: { contains: search } }
      ];
    }

    const [inquiries, total] = await Promise.all([
      this.prisma.inquiry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          reply: true
        }
      }),
      this.prisma.inquiry.count({ where })
    ]);

    const summary = await this.getExpertInquirySummary(expert.id);

    return {
      inquiries: inquiries.map(inq => this.formatInquiryResponse(inq, 'expert')),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      summary
    };
  }

  async getExpertInquiry(userId: number, inquiryId: string) {
    // User ID로 Expert 찾기
    const expert = await this.prisma.expert.findUnique({
      where: { userId }
    });

    if (!expert) {
      throw new NotFoundException('전문가 프로필을 찾을 수 없습니다.');
    }

    const inquiry = await this.prisma.inquiry.findFirst({
      where: { id: inquiryId, expertId: expert.id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reply: true
      }
    });

    if (!inquiry) {
      throw new NotFoundException('문의를 찾을 수 없습니다.');
    }

    return this.formatInquiryResponse(inquiry, 'expert');
  }

  async markAsRead(userId: number, inquiryId: string) {
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

    await this.prisma.inquiry.update({
      where: { id: inquiryId },
      data: { isRead: true }
    });

    return { id: inquiryId, isRead: true };
  }

  async createReply(userId: number, inquiryId: string, dto: CreateReplyDto) {
    // User ID로 Expert 찾기
    const expert = await this.prisma.expert.findUnique({
      where: { userId }
    });

    if (!expert) {
      throw new NotFoundException('전문가 프로필을 찾을 수 없습니다.');
    }

    // 문의 소유권 확인
    const inquiry = await this.prisma.inquiry.findFirst({
      where: { id: inquiryId, expertId: expert.id }
    });

    if (!inquiry) {
      throw new NotFoundException('문의를 찾을 수 없습니다.');
    }

    // 이미 답변이 있는지 확인
    const existingReply = await this.prisma.inquiryReply.findUnique({
      where: { inquiryId }
    });

    if (existingReply) {
      throw new ForbiddenException('이미 답변이 작성되었습니다.');
    }

    // 답변 생성
    const reply = await this.prisma.inquiryReply.create({
      data: {
        inquiryId,
        content: dto.content
      }
    });

    // 문의 업데이트 (읽음 표시)
    await this.prisma.inquiry.update({
      where: { id: inquiryId },
      data: { isRead: true, updatedAt: new Date() }
    });

    return {
      replyId: reply.id,
      inquiryId,
      content: reply.content,
      createdAt: reply.createdAt
    };
  }

  async deleteExpertInquiry(userId: number, inquiryId: string) {
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

    await this.prisma.inquiry.delete({
      where: { id: inquiryId }
    });

    return { message: '문의가 삭제되었습니다.' };
  }

  async getExpertInquiryStats(userId: number) {
    const expert = await this.prisma.expert.findUnique({
      where: { userId }
    });

    if (!expert) {
      throw new NotFoundException('전문가 프로필을 찾을 수 없습니다.');
    }

    const [total, unread, replied] = await Promise.all([
      this.prisma.inquiry.count({ where: { expertId: expert.id } }),
      this.prisma.inquiry.count({ where: { expertId: expert.id, isRead: false } }),
      this.prisma.inquiry.count({ where: { expertId: expert.id, reply: { isNot: null } } })
    ]);

    return {
      total,
      unread,
      replied,
      pending: total - replied
    };
  }

  // ==========================================
  // Private 헬퍼 메서드
  // ==========================================

  /**
   * Enum 변환: 소문자(DTO) → 대문자(Prisma)
   */
  private toPrismaCategory(category: string): InquiryCategory {
    const map: Record<string, InquiryCategory> = {
      'schedule': InquiryCategory.SCHEDULE,
      'time': InquiryCategory.TIME,
      'price': InquiryCategory.PRICE,
      'method': InquiryCategory.METHOD,
      'other': InquiryCategory.OTHER
    };
    return map[category.toLowerCase()] || InquiryCategory.OTHER;
  }

  /**
   * Enum 변환: 대문자(Prisma) → 소문자(API 응답)
   */
  private toApiCategory(category: InquiryCategory): string {
    return category.toLowerCase();
  }

  /**
   * 응답 포맷팅
   */
  private formatInquiryResponse(inquiry: any, role: 'client' | 'expert') {
    const base = {
      id: inquiry.id,
      subject: inquiry.subject,
      content: inquiry.content,
      category: this.toApiCategory(inquiry.category), // 소문자 변환
      isRead: inquiry.isRead,
      hasReply: !!inquiry.reply,
      reply: inquiry.reply ? {
        content: inquiry.reply.content,
        repliedAt: inquiry.reply.createdAt.toISOString()
      } : undefined,
      createdAt: inquiry.createdAt.toISOString(),
      updatedAt: inquiry.updatedAt.toISOString()
    };

    if (role === 'client') {
      return {
        ...base,
        expertName: inquiry.expert?.name,
        expertProfileImage: inquiry.expert?.avatarUrl
      };
    } else {
      return {
        ...base,
        clientName: inquiry.client?.name,
        clientEmail: inquiry.client?.email
      };
    }
  }

  private async getClientInquirySummary(clientId: number) {
    const [total, unread, replied] = await Promise.all([
      this.prisma.inquiry.count({ where: { clientId } }),
      this.prisma.inquiry.count({ where: { clientId, isRead: false } }),
      this.prisma.inquiry.count({ where: { clientId, reply: { isNot: null } } })
    ]);

    return { total, unread, replied };
  }

  private async getExpertInquirySummary(expertId: number) {
    const [total, unread, replied] = await Promise.all([
      this.prisma.inquiry.count({ where: { expertId } }),
      this.prisma.inquiry.count({ where: { expertId, isRead: false } }),
      this.prisma.inquiry.count({ where: { expertId, reply: { isNot: null } } })
    ]);

    return { total, unread, replied };
  }
}
```

### 3. Controller (변경 없음)

Controller는 이전 계획서와 동일합니다. Service 메서드가 Expert 조회를 처리하므로 Controller는 그대로 사용 가능합니다.

**파일**: `apps/api/src/inquiry/inquiry.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InquiryService } from './inquiry.service';
import { CreateInquiryDto, CreateReplyDto, QueryInquiryDto } from './dto';

@Controller('inquiries')
@UseGuards(JwtAuthGuard)
export class InquiryController {
  constructor(private inquiryService: InquiryService) {}

  // 클라이언트용
  @Post('client')
  async createInquiry(@Req() req: any, @Body() dto: CreateInquiryDto) {
    const result = await this.inquiryService.createInquiry(req.user.id, dto);
    return { success: true, data: result };
  }

  @Get('client')
  async getClientInquiries(@Req() req: any, @Query() query: QueryInquiryDto) {
    const result = await this.inquiryService.getClientInquiries(req.user.id, query);
    return { success: true, data: result };
  }

  @Get('client/:id')
  async getClientInquiry(@Req() req: any, @Param('id') id: string) {
    const result = await this.inquiryService.getClientInquiry(req.user.id, id);
    return { success: true, data: result };
  }

  @Delete('client/:id')
  async deleteClientInquiry(@Req() req: any, @Param('id') id: string) {
    const result = await this.inquiryService.deleteClientInquiry(req.user.id, id);
    return { success: true, ...result };
  }

  // 전문가용
  @Get('expert')
  async getExpertInquiries(@Req() req: any, @Query() query: QueryInquiryDto) {
    const result = await this.inquiryService.getExpertInquiries(req.user.id, query);
    return { success: true, data: result };
  }

  @Get('expert/stats')
  async getExpertInquiryStats(@Req() req: any) {
    const result = await this.inquiryService.getExpertInquiryStats(req.user.id);
    return { success: true, data: result };
  }

  @Get('expert/:id')
  async getExpertInquiry(@Req() req: any, @Param('id') id: string) {
    const result = await this.inquiryService.getExpertInquiry(req.user.id, id);
    return { success: true, data: result };
  }

  @Patch('expert/:id/read')
  async markInquiryAsRead(@Req() req: any, @Param('id') id: string) {
    const result = await this.inquiryService.markAsRead(req.user.id, id);
    return { success: true, data: result };
  }

  @Post('expert/:id/reply')
  async replyToInquiry(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CreateReplyDto
  ) {
    const result = await this.inquiryService.createReply(req.user.id, id, dto);
    return { success: true, data: result };
  }

  @Delete('expert/:id')
  async deleteExpertInquiry(@Req() req: any, @Param('id') id: string) {
    const result = await this.inquiryService.deleteExpertInquiry(req.user.id, id);
    return { success: true, ...result };
  }
}
```

---

## 🎨 프론트엔드 통합

프론트엔드는 이전 계획서와 거의 동일하지만 **Enum 값을 소문자로 전송**합니다.

### API 클라이언트 (변경 없음)

**파일**: `/apps/web/src/lib/inquiries.ts`

```typescript
import { api } from './api';

export interface CreateInquiryRequest {
  expertId: number;
  subject: string;
  content: string;
  category: 'schedule' | 'time' | 'price' | 'method' | 'other'; // 소문자
}

export interface QueryInquiryParams {
  status?: 'all' | 'unread' | 'replied';
  search?: string;
  page?: number;
  limit?: number;
}

export interface Inquiry {
  id: string;
  subject: string;
  content: string;
  category: string; // 소문자로 받음
  isRead: boolean;
  hasReply: boolean;
  reply?: {
    content: string;
    repliedAt: string;
  };
  createdAt: string;
  updatedAt: string;
  expertName?: string;
  expertProfileImage?: string;
  clientName?: string;
  clientEmail?: string;
}

export interface InquiryListResponse {
  inquiries: Inquiry[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: {
    total: number;
    unread: number;
    replied: number;
  };
}

// 클라이언트용 API
export async function createInquiry(data: CreateInquiryRequest) {
  const response = await api.post('/inquiries/client', data);
  return response;
}

export async function getClientInquiries(params?: QueryInquiryParams) {
  const response = await api.get<InquiryListResponse>('/inquiries/client', { params });
  return response;
}

export async function getClientInquiry(id: string) {
  const response = await api.get(`/inquiries/client/${id}`);
  return response;
}

export async function deleteClientInquiry(id: string) {
  const response = await api.delete(`/inquiries/client/${id}`);
  return response;
}

// 전문가용 API
export async function getExpertInquiries(params?: QueryInquiryParams) {
  const response = await api.get<InquiryListResponse>('/inquiries/expert', { params });
  return response;
}

export async function getExpertInquiry(id: string) {
  const response = await api.get(`/inquiries/expert/${id}`);
  return response;
}

export async function markInquiryAsRead(id: string) {
  const response = await api.patch(`/inquiries/expert/${id}/read`);
  return response;
}

export async function replyToInquiry(id: string, content: string) {
  const response = await api.post(`/inquiries/expert/${id}/reply`, { content });
  return response;
}

export async function deleteExpertInquiry(id: string) {
  const response = await api.delete(`/inquiries/expert/${id}`);
  return response;
}

export async function getExpertInquiryStats() {
  const response = await api.get('/inquiries/expert/stats');
  return response;
}
```

### ExpertProfileDetail 수정

[이전 계획서와 동일 - 생략]

### ClientMessagesPage 수정

[이전 계획서와 동일 - 생략]

### ExpertMessagesPage 수정

[이전 계획서와 동일 - 생략]

---

## 🚀 구현 단계

### Phase 1: 데이터베이스 마이그레이션 (30분)

```bash
cd apps/api

# 1. schema.prisma 수정 (Inquiry, InquiryReply, InquiryCategory 추가)

# 2. User 모델에 관계 추가
# clientInquiries  Inquiry[]  @relation("ClientInquiries")

# 3. Expert 모델에 관계 추가
# expertInquiries  Inquiry[]  @relation("ExpertInquiries")

# 4. 마이그레이션 생성
npx prisma migrate dev --name add_inquiry_system

# 5. Prisma Client 재생성
npx prisma generate

# 6. 확인
npx prisma studio
```

### Phase 2: 백엔드 구현 (2-3시간)

```bash
cd apps/api/src
mkdir inquiry
cd inquiry
mkdir dto

# DTO 파일 생성
touch dto/create-inquiry.dto.ts
touch dto/create-reply.dto.ts
touch dto/query-inquiry.dto.ts

# Service, Controller, Module 생성
touch inquiry.service.ts
touch inquiry.controller.ts
touch inquiry.module.ts

# 각 파일에 코드 작성 (위의 코드 참조)

# app.module.ts에 InquiryModule 등록
```

### Phase 3: 프론트엔드 API 클라이언트 (1시간)

```bash
cd apps/web/src/lib
touch inquiries.ts

# API 클라이언트 함수 작성 (위의 코드 참조)
```

### Phase 4: 프론트엔드 통합 (2-3시간)

1. ExpertProfileDetail.tsx 수정 (문의하기 버튼)
2. ClientMessagesPage 수정 (데이터 연동)
3. ExpertMessagesPage 수정 (데이터 연동)

### Phase 5: 테스트 및 검증 (1-2시간)

테스트 시나리오:
- ✅ 클라이언트 → 전문가 문의 생성
- ✅ 전문가 → 문의 확인 및 읽음 표시
- ✅ 전문가 → 답변 작성
- ✅ 클라이언트 → 답변 확인
- ✅ 필터 및 검색
- ✅ 문의 삭제

---

## ✅ 수정 요약

| 항목 | 이전 계획 | 수정된 계획 |
|------|----------|------------|
| ID 생성 | `@default(cuid())` | `@default(uuid())` |
| DB 타입 | PostgreSQL 전용 | MySQL 호환 |
| Enum 처리 | 대문자만 | 대소문자 자동 변환 |
| Expert 조회 | 누락 | userId → Expert.id |
| Cascade 삭제 | 누락 | onDelete: Cascade 추가 |

---

## 🎯 구현 시작

이제 수정된 계획서를 기반으로 구현을 시작합니다!

**작성자**: Claude (AI Assistant)
**최종 수정일**: 2025-10-24
