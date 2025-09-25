import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
  HttpStatus,
  HttpCode,
  UsePipes,
} from '@nestjs/common';
import { Request } from 'express';
import { CommunityService } from './community.service';
import { JwtGuard } from '../auth/jwt.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  PostQuerySchema,
  PostQueryDto,
  CreatePostSchema,
  CreatePostDto,
  ExpertProposalSchema,
  ExpertProposalDto,
} from './community.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    roles: string[];
  };
}

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getCommunityStats() {
    try {
      const stats = await this.communityService.getCommunityStats();
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'E_COMMUNITY_STATS_FAILED',
          message: '커뮤니티 통계를 가져오는데 실패했습니다.',
          details: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  @Get('posts')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(PostQuerySchema))
  async getPosts(@Query() query: PostQueryDto) {
    try {
      const posts = await this.communityService.getPosts(query);
      return {
        success: true,
        data: posts,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'E_COMMUNITY_POSTS_FAILED',
          message: '게시글을 가져오는데 실패했습니다.',
          details: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  @Post('posts')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(CreatePostSchema))
  async createPost(
    @Body() createPostDto: CreatePostDto,
    @Req() req: AuthenticatedRequest,
  ) {
    try {
      const post = await this.communityService.createPost(
        createPostDto,
        req.user.id,
      );
      return {
        success: true,
        data: post,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'E_COMMUNITY_POST_CREATE_FAILED',
          message: '게시글 작성에 실패했습니다.',
          details: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  @Get('categories')
  @HttpCode(HttpStatus.OK)
  async getCategories() {
    try {
      const categories = await this.communityService.getCategories();
      return {
        success: true,
        data: categories,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'E_COMMUNITY_CATEGORIES_FAILED',
          message: '카테고리를 가져오는데 실패했습니다.',
          details: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  @Get('tags/popular')
  @HttpCode(HttpStatus.OK)
  async getPopularTags() {
    try {
      const tags = await this.communityService.getPopularTags();
      return {
        success: true,
        data: tags,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'E_COMMUNITY_TAGS_FAILED',
          message: '인기 태그를 가져오는데 실패했습니다.',
          details: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  @Post('expert-proposals')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(ExpertProposalSchema))
  async createExpertProposal(
    @Body() proposalDto: ExpertProposalDto,
    @Req() req: AuthenticatedRequest,
  ) {
    try {
      // 전문가 권한 확인
      if (!req.user.roles.includes('EXPERT')) {
        return {
          success: false,
          error: {
            code: 'E_COMMUNITY_EXPERT_REQUIRED',
            message: '전문가만 상담 제안을 할 수 있습니다.',
          },
        };
      }

      const result = await this.communityService.createExpertProposal(proposalDto);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'E_COMMUNITY_PROPOSAL_CREATE_FAILED',
          message: '전문가 제안 생성에 실패했습니다.',
          details: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }
}