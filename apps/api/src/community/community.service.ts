import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CommunityStatsDto,
  PostQueryDto,
  CreatePostDto,
  PostResponseDto,
  CategoryResponseDto,
  ExpertProposalDto,
} from './community.dto';

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  async getCommunityStats(): Promise<CommunityStatsDto> {
    const [totalPosts, todayPosts, activeUsers] = await Promise.all([
      this.prisma.communityPost.count({
        where: { status: 'published' },
      }),
      this.prisma.communityPost.count({
        where: {
          status: 'published',
          publishedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.user.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30일 내 활동
          },
        },
      }),
    ]);

    return {
      totalPosts,
      activeUsers,
      todayPosts,
    };
  }

  async getPosts(query: PostQueryDto): Promise<PostResponseDto[]> {
    const where: any = {
      status: 'published',
    };

    // 카테고리 필터
    if (query.category && query.category !== 'all') {
      const category = await this.prisma.category.findFirst({
        where: {
          OR: [
            { nameKo: { contains: query.category } },
            { nameEn: { contains: query.category } },
            { slug: query.category }
          ]
        },
      });
      if (category) {
        where.categoryId = category.id;
      }
    }

    // 검색 필터
    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { content: { contains: query.search } },
      ];
    }

    // 사용자 게시글 필터
    if (query.userId && query.type === 'posts') {
      where.userId = parseInt(query.userId);
    }

    // 정렬 옵션
    let orderBy: any = {};
    switch (query.sortBy) {
      case 'popular':
        orderBy = { likes: 'desc' };
        break;
      case 'comments':
        orderBy = { comments: 'desc' };
        break;
      case 'views':
        orderBy = { views: 'desc' };
        break;
      case 'latest':
      default:
        orderBy = { publishedAt: 'desc' };
        break;
    }

    const posts = await this.prisma.communityPost.findMany({
      where,
      orderBy,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            roles: true,
          },
        },
        category: {
          select: {
            nameKo: true,
          },
        },
      },
      take: 50, // 페이지네이션 추가 가능
    });

    return posts.map(post => ({
      id: post.id.toString(),
      title: post.title,
      content: post.content,
      category: post.category.nameKo,
      postType: post.postType,
      tags: Array.isArray(post.tags) ? post.tags as string[] : [],
      author: {
        id: post.user.id,
        name: post.isAnonymous ? '익명' : post.user.name || '사용자',
        role: Array.isArray(post.user.roles) && post.user.roles.includes('EXPERT') ? 'EXPERT' : 'USER',
      },
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      likes: post.likes,
      comments: post.comments,
      views: post.views,
    }));
  }

  async createPost(createPostDto: CreatePostDto, userId: number): Promise<PostResponseDto> {
    // 카테고리 찾기
    const category = await this.prisma.category.findFirst({
      where: {
        OR: [
          { nameKo: createPostDto.category },
          { nameEn: createPostDto.category },
          { slug: createPostDto.category }
        ]
      },
    });

    if (!category) {
      throw new Error('카테고리를 찾을 수 없습니다.');
    }

    // 사용자 정보 가져오기
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, roles: true },
    });

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    const now = new Date();
    const newPost = await this.prisma.communityPost.create({
      data: {
        userId,
        categoryId: category.id,
        title: createPostDto.title,
        content: createPostDto.content,
        postType: createPostDto.postType,
        tags: createPostDto.tags || [],
        status: 'published',
        publishedAt: now,
        isAnonymous: createPostDto.isAnonymous || false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            roles: true,
          },
        },
        category: {
          select: {
            nameKo: true,
          },
        },
      },
    });

    return {
      id: newPost.id.toString(),
      title: newPost.title,
      content: newPost.content,
      category: newPost.category.nameKo,
      postType: newPost.postType,
      tags: Array.isArray(newPost.tags) ? newPost.tags as string[] : [],
      author: {
        id: newPost.user.id,
        name: newPost.isAnonymous ? '익명' : newPost.user.name || '사용자',
        role: Array.isArray(newPost.user.roles) && newPost.user.roles.includes('EXPERT') ? 'EXPERT' : 'USER',
      },
      createdAt: newPost.createdAt.toISOString(),
      updatedAt: newPost.updatedAt.toISOString(),
      likes: newPost.likes,
      comments: newPost.comments,
      views: newPost.views,
      urgency: createPostDto.urgency,
      preferredMethod: createPostDto.preferredMethod,
    };
  }

  async getCategories(): Promise<CategoryResponseDto[]> {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            communityPosts: {
              where: { status: 'published' }
            }
          }
        }
      },
      orderBy: { order: 'asc' }
    });

    // 전체 카테고리를 첫 번째에 추가
    const totalPosts = await this.prisma.communityPost.count({
      where: { status: 'published' }
    });

    const allCategory: CategoryResponseDto = {
      id: 0,
      name: '전체',
      description: '모든 카테고리의 게시글',
      color: '#6B7280',
      isActive: true,
      postCount: totalPosts,
    };

    const categoryResults: CategoryResponseDto[] = categories.map(category => ({
      id: category.id,
      name: category.nameKo,
      description: category.description || '',
      color: '#3B82F6', // 기본 색상, 필요시 DB에 추가
      isActive: category.isActive,
      postCount: category._count.communityPosts,
    }));

    return [allCategory, ...categoryResults];
  }

  async getPopularTags(): Promise<string[]> {
    const posts = await this.prisma.communityPost.findMany({
      where: {
        status: 'published',
        tags: {
          not: Prisma.DbNull,
        },
      },
      select: { tags: true }
    });

    // 모든 태그를 수집하고 빈도수 계산
    const tagCount: { [key: string]: number } = {};

    posts.forEach(post => {
      if (Array.isArray(post.tags)) {
        (post.tags as string[]).forEach(tag => {
          if (typeof tag === 'string' && tag.trim()) {
            tagCount[tag] = (tagCount[tag] || 0) + 1;
          }
        });
      }
    });

    // 빈도수 기준으로 정렬하여 상위 10개 태그 반환
    return Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);
  }

  async createExpertProposal(proposalDto: ExpertProposalDto): Promise<{ success: boolean }> {
    // TODO: 실제 DB 저장으로 대체
    // Mock success response for now
    console.log('Expert proposal created:', proposalDto);
    return { success: true };
  }
}