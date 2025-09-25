import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ulid } from 'ulid';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async getReviews(options: { isPublic?: boolean; limit?: number; expertId?: number }) {
    const { isPublic = true, limit = 12, expertId } = options;
    
    const where: any = {};
    if (isPublic !== undefined) where.isPublic = isPublic;
    if (expertId) where.expertId = expertId;

    const reviews = await this.prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    return { reviews };
  }

  async createReview(data: {
    userId: number;
    expertId: number;
    reservationId: number;
    rating: number;
    content: string;
    isPublic?: boolean;
  }) {
    // 별점 검증
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException({
        success: false,
        error: { code: 'E_REVIEW_RATING', message: 'Rating must be between 1 and 5' }
      });
    }

    try {
      // 트랜잭션으로 리뷰 생성과 reviewCount 업데이트를 동시에 처리
      const result = await this.prisma.$transaction(async (prisma) => {
        // 1. 리뷰 생성
        const review = await prisma.review.create({
          data: {
            displayId: ulid(),
            userId: data.userId,
            expertId: data.expertId,
            reservationId: data.reservationId,
            rating: data.rating,
            content: data.content,
            isPublic: data.isPublic ?? true,
          },
        });

        // 2. Expert의 reviewCount 증가 (공개 리뷰인 경우에만)
        if (data.isPublic !== false) {
          await prisma.expert.update({
            where: { id: data.expertId },
            data: { reviewCount: { increment: 1 } },
          });
        }

        return review;
      });

      return { displayId: result.displayId };
    } catch (error: any) {
      // P2002: Unique constraint violation (reservationId가 이미 존재)
      if (error.code === 'P2002') {
        // 멱등적으로 기존 리뷰 반환
        const existing = await this.prisma.review.findUnique({
          where: { reservationId: data.reservationId }
        });
        return { displayId: existing?.displayId || '' };
      }
      throw error;
    }
  }
}
