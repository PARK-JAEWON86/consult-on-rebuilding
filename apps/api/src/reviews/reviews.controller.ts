import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { z } from 'zod';

const CreateReviewSchema = z.object({
  userId: z.number().int().positive(),
  expertId: z.number().int().positive(),
  reservationId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  content: z.string().min(10).max(500),
  isPublic: z.boolean().optional()
});

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly svc: ReviewsService) {}

  @Get()
  async getReviews(
    @Query('isPublic') isPublic?: string,
    @Query('limit') limit?: string,
    @Query('expertId') expertId?: string
  ) {
    const options = {
      isPublic: isPublic ? isPublic === 'true' : true,
      limit: limit ? parseInt(limit, 10) : 12,
      expertId: expertId ? parseInt(expertId, 10) : undefined,
    };
    
    const data = await this.svc.getReviews(options);
    return { success: true, data };
  }

  @Post()
  async createReview(@Body(new ZodValidationPipe(CreateReviewSchema)) body: any) {
    const data = await this.svc.createReview(body);
    return { success: true, data };
  }
}
