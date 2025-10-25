import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExpertStatsService } from '../experts/expert-stats.service';
import { MailService } from '../mail/mail.service';
import { InquiryCategory } from '@prisma/client';
import { CreateInquiryDto, CreateReplyDto, QueryInquiryDto } from './dto';

@Injectable()
export class InquiryService {
  constructor(
    private prisma: PrismaService,
    private expertStatsService: ExpertStatsService,
    private mailService: MailService
  ) {}

  // ==========================================
  // 클라이언트용 메서드
  // ==========================================

  async createInquiry(clientId: number, dto: CreateInquiryDto) {
    // 전문가 정보 조회 (user 정보 포함)
    const expert = await this.prisma.expert.findUnique({
      where: { id: dto.expertId },
      include: {
        user: {
          select: { email: true, name: true }
        }
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
          select: { id: true, name: true, avatarUrl: true, title: true }
        }
      }
    });

    // 전문가에게 이메일 알림 (비동기, non-blocking)
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
            select: { id: true, name: true, avatarUrl: true }
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
          select: { id: true, displayId: true, name: true, avatarUrl: true, title: true, specialty: true }
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

    await this.prisma.inquiry.delete({ where: { id: inquiryId } });

    return { message: '문의가 삭제되었습니다.' };
  }

  // ==========================================
  // 전문가용 메서드
  // ==========================================

  async getExpertInquiries(userId: number, query: QueryInquiryDto) {
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
            select: { id: true, name: true, email: true }
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
          select: { id: true, name: true, email: true }
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

    // 응답시간 통계 업데이트 (비동기, 실패해도 메인 작업에 영향 없음)
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

    await this.prisma.inquiry.delete({ where: { id: inquiryId } });

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

  private toPrismaCategory(category: string): InquiryCategory {
    const map: Record<string, InquiryCategory> = {
      'schedule': InquiryCategory.SCHEDULE,
      'time': InquiryCategory.TIME,
      'price': InquiryCategory.PRICE,
      'method': InquiryCategory.METHOD,
      'other': InquiryCategory.OTHER
    };
    return map[category?.toLowerCase()] || InquiryCategory.OTHER;
  }

  private toApiCategory(category: InquiryCategory): string {
    return category.toLowerCase();
  }

  private formatInquiryResponse(inquiry: any, role: 'client' | 'expert') {
    const base = {
      id: inquiry.id,
      subject: inquiry.subject,
      content: inquiry.content,
      category: this.toApiCategory(inquiry.category),
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
