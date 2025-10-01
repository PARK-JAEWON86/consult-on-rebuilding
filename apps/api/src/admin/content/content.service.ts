import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

export interface PostListQuery {
  page?: number
  limit?: number
  search?: string
  status?: 'published' | 'hidden' | 'deleted'
  type?: 'general' | 'consultation_review' | 'consultation_request' | 'expert_intro'
}

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 게시글 목록 조회
   */
  async getPosts(query: PostListQuery) {
    const { page = 1, limit = 20, search, status, type } = query

    const where: any = {}

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (type) {
      where.postType = type
    }

    const [data, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          category: {
            select: {
              id: true,
              nameKo: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.communityPost.count({ where }),
    ])

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * 게시글 상세 조회
   */
  async getPostDetail(id: number) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        category: true,
        communityComments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!post) {
      throw new NotFoundException({
        success: false,
        error: { code: 'E_POST_NOT_FOUND', message: 'Post not found' },
      })
    }

    return post
  }

  /**
   * 게시글 상태 업데이트
   */
  async updatePostStatus(id: number, status: 'published' | 'hidden' | 'deleted') {
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
    })

    if (!post) {
      throw new NotFoundException({
        success: false,
        error: { code: 'E_POST_NOT_FOUND', message: 'Post not found' },
      })
    }

    await this.prisma.communityPost.update({
      where: { id },
      data: { status },
    })

    return { success: true }
  }

  /**
   * 게시글 삭제
   */
  async deletePost(id: number) {
    await this.prisma.communityPost.update({
      where: { id },
      data: { status: 'deleted' },
    })

    return { success: true }
  }

  /**
   * 댓글 목록 조회
   */
  async getComments(query: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 20, status } = query

    const where: any = {}

    if (status) {
      where.status = status
    }

    const [data, total] = await Promise.all([
      this.prisma.communityComment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          post: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.communityComment.count({ where }),
    ])

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * 댓글 상태 업데이트
   */
  async updateCommentStatus(id: number, status: 'active' | 'hidden' | 'deleted') {
    await this.prisma.communityComment.update({
      where: { id },
      data: { status },
    })

    return { success: true }
  }

  /**
   * 댓글 삭제
   */
  async deleteComment(id: number) {
    await this.prisma.communityComment.update({
      where: { id },
      data: { status: 'deleted' },
    })

    return { success: true }
  }

  /**
   * 컨텐츠 통계
   */
  async getContentStatistics() {
    const [
      totalPosts,
      publishedPosts,
      hiddenPosts,
      totalComments,
      activeComments,
      last7DaysPosts,
    ] = await Promise.all([
      this.prisma.communityPost.count(),
      this.prisma.communityPost.count({ where: { status: 'published' } }),
      this.prisma.communityPost.count({ where: { status: 'hidden' } }),
      this.prisma.communityComment.count(),
      this.prisma.communityComment.count({ where: { status: 'active' } }),
      this.prisma.communityPost.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ])

    return {
      totalPosts,
      publishedPosts,
      hiddenPosts,
      totalComments,
      activeComments,
      last7DaysPosts,
    }
  }
}
