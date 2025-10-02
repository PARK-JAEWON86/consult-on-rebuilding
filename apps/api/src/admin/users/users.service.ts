import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

export interface UserListQuery {
  page?: number
  limit?: number
  search?: string
  role?: string
  status?: 'active' | 'suspended'
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 사용자 목록 조회
   */
  async getUsers(query: UserListQuery) {
    const { search, role, status } = query
    // 쿼리 파라미터는 문자열로 전달되므로 숫자로 변환
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 20

    const where: any = {}

    // 검색
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ]
    }

    // 역할 필터 (roles는 JSON 배열이므로 array_contains 사용)
    if (role) {
      where.roles = {
        array_contains: role
      }
    }

    // 상태 필터 (간단하게 처리 - 실제로는 suspended 필드가 필요)
    // 여기서는 이메일 인증 여부로 대체
    if (status === 'active') {
      where.emailVerifiedAt = { not: null }
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          roles: true,
          avatarUrl: true,
          createdAt: true,
          emailVerifiedAt: true,
          phoneNumber: true,
          phoneVerified: true,
          expert: {
            select: {
              id: true,
              displayId: true,
              isActive: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ])

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * 사용자 상세 조회
   */
  async getUserDetail(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        expert: true,
        reservations: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            expert: {
              select: {
                name: true,
                displayId: true,
              },
            },
          },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            expert: {
              select: {
                name: true,
                displayId: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      throw new NotFoundException({
        success: false,
        error: { code: 'E_USER_NOT_FOUND', message: 'User not found' },
      })
    }

    // 통계 계산
    const stats = await this.getUserStats(id)

    return {
      user,
      stats,
    }
  }

  /**
   * 사용자 통계
   */
  private async getUserStats(userId: number) {
    const [totalReservations, totalSpent, totalReviews] = await Promise.all([
      this.prisma.reservation.count({
        where: { userId },
      }),
      this.prisma.reservation.aggregate({
        where: {
          userId,
          status: 'CONFIRMED',
        },
        _sum: {
          cost: true,
        },
      }),
      this.prisma.review.count({
        where: { userId },
      }),
    ])

    // 최근 활동 (최근 예약 날짜)
    const lastReservation = await this.prisma.reservation.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    })

    return {
      totalReservations,
      totalSpent: totalSpent._sum.cost || 0,
      totalReviews,
      lastActive: lastReservation?.createdAt || null,
    }
  }

  /**
   * 사용자 역할 업데이트
   */
  async updateUserRoles(userId: number, roles: string[]) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException({
        success: false,
        error: { code: 'E_USER_NOT_FOUND', message: 'User not found' },
      })
    }

    // 유효한 역할 검증
    const validRoles = ['USER', 'EXPERT', 'ADMIN']
    const invalidRoles = roles.filter((r) => !validRoles.includes(r))

    if (invalidRoles.length > 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'E_INVALID_ROLES',
          message: `Invalid roles: ${invalidRoles.join(', ')}`,
        },
      })
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: JSON.stringify(roles),
      },
    })

    return { success: true }
  }

  /**
   * 전문가 상태 토글 (활성/비활성)
   */
  async toggleExpertStatus(expertId: number) {
    const expert = await this.prisma.expert.findUnique({
      where: { id: expertId },
    })

    if (!expert) {
      throw new NotFoundException({
        success: false,
        error: { code: 'E_EXPERT_NOT_FOUND', message: 'Expert not found' },
      })
    }

    await this.prisma.expert.update({
      where: { id: expertId },
      data: {
        isActive: !expert.isActive,
      },
    })

    return { success: true, isActive: !expert.isActive }
  }

  /**
   * 사용자 통계 (관리자용)
   */
  async getUserStatistics() {
    const [total, verified, withExpert, last30Days] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: { emailVerifiedAt: { not: null } },
      }),
      this.prisma.user.count({
        where: { expert: { isNot: null } },
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ])

    return {
      total,
      verified,
      withExpert,
      last30Days,
      verificationRate: total > 0 ? ((verified / total) * 100).toFixed(1) : '0',
    }
  }
}
