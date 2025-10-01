import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { Cron, CronExpression } from '@nestjs/schedule'

export interface DashboardSummary {
  summary: {
    newUsers: { value: number; change: number }
    newApplications: { value: number; change: number }
    revenue: { value: number; change: number }
    activeUsers: { value: number; change: number }
  }
  charts: {
    userGrowth: Array<{ date: string; users: number }>
    revenueByDay: Array<{ date: string; revenue: number }>
    applicationsByStatus: Array<{ name: string; value: number }>
  }
  recentActivity: Array<{
    type: string
    message: string
    timestamp: string
  }>
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 대시보드 요약 정보 조회
   */
  async getDashboardSummary(period: 'day' | 'week' | 'month' = 'day'): Promise<DashboardSummary> {
    const now = new Date()
    const currentPeriodStart = this.getPeriodStart(now, period)
    const previousPeriodStart = this.getPeriodStart(currentPeriodStart, period)

    // 현재 기간 지표
    const [
      currentUsers,
      previousUsers,
      currentApplications,
      previousApplications,
      currentRevenue,
      previousRevenue,
    ] = await Promise.all([
      this.getUserCount(currentPeriodStart, now),
      this.getUserCount(previousPeriodStart, currentPeriodStart),
      this.getApplicationCount(currentPeriodStart, now),
      this.getApplicationCount(previousPeriodStart, currentPeriodStart),
      this.getRevenue(currentPeriodStart, now),
      this.getRevenue(previousPeriodStart, currentPeriodStart),
    ])

    // 활성 사용자 (최근 7일 이내 활동)
    const activeUsersCount = await this.getActiveUserCount(7)

    // 차트 데이터
    const userGrowth = await this.getUserGrowthData(30)
    const revenueByDay = await this.getRevenueByDay(30)
    const applicationsByStatus = await this.getApplicationsByStatus()

    // 최근 활동
    const recentActivity = await this.getRecentActivity(10)

    return {
      summary: {
        newUsers: {
          value: currentUsers,
          change: this.calculateChange(currentUsers, previousUsers),
        },
        newApplications: {
          value: currentApplications,
          change: this.calculateChange(currentApplications, previousApplications),
        },
        revenue: {
          value: currentRevenue,
          change: this.calculateChange(currentRevenue, previousRevenue),
        },
        activeUsers: {
          value: activeUsersCount,
          change: 0, // 이전 기간 비교는 복잡하므로 생략
        },
      },
      charts: {
        userGrowth,
        revenueByDay,
        applicationsByStatus,
      },
      recentActivity,
    }
  }

  /**
   * 고급 대시보드 데이터 조회 (새로운 UX/UI용)
   */
  async getEnhancedDashboard(period: 'day' | 'week' | 'month' = 'day') {
    const now = new Date()
    const currentPeriodStart = this.getPeriodStart(now, period)

    // 병렬로 모든 데이터 가져오기
    const [
      totalUsers,
      totalExperts,
      activeExperts,
      pendingApplications,
      todayConsultations,
      totalConsultations,
      pendingConsultations,
      completedConsultations,
      canceledConsultations,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      totalPosts,
      totalComments,
      recentUsers,
      recentApplications,
      recentReservations,
      categoryDistribution,
      expertLevelDistribution,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.expert.count(),
      this.prisma.expert.count({ where: { isActive: true } }),
      this.prisma.expertApplication.count({ where: { status: 'PENDING' } }),
      this.getTodayConsultationCount(),
      this.prisma.reservation.count(),
      this.prisma.reservation.count({ where: { status: 'PENDING' } }),
      this.prisma.reservation.count({ where: { status: 'CONFIRMED' } }),
      this.prisma.reservation.count({ where: { status: 'CANCELED' } }),
      this.getTodayRevenue(),
      this.getWeekRevenue(),
      this.getMonthRevenue(),
      this.prisma.communityPost.count(),
      this.prisma.communityComment.count(),
      this.getRecentUsers(5),
      this.getRecentApplicationsDetailed(5),
      this.getRecentReservationsDetailed(5),
      this.getCategoryDistribution(),
      this.getExpertLevelDistribution(),
    ])

    const newUsersToday = await this.getUserCount(currentPeriodStart, now)
    const activeUsers = await this.getActiveUserCount(7)
    const approvalRate = await this.getApprovalRate()

    return {
      summary: {
        users: {
          total: totalUsers,
          new_today: newUsersToday,
          active_users: activeUsers,
          growth_rate: 0, // 계산 필요시 추가
        },
        experts: {
          total: totalExperts,
          active: activeExperts,
          pending_applications: pendingApplications,
          approval_rate: approvalRate,
        },
        consultations: {
          total: totalConsultations,
          today: todayConsultations,
          pending: pendingConsultations,
          completed: completedConsultations,
          canceled: canceledConsultations,
          completion_rate: totalConsultations > 0
            ? Math.round((completedConsultations / totalConsultations) * 100)
            : 0,
        },
        revenue: {
          today: todayRevenue,
          this_week: weekRevenue,
          this_month: monthRevenue,
          growth: 0, // 계산 필요시 추가
          avg_transaction: totalConsultations > 0 ? Math.round(monthRevenue / totalConsultations) : 0,
        },
        community: {
          total_posts: totalPosts,
          total_comments: totalComments,
          pending_review: 0, // hidden 상태 게시글 계산 필요
          reported_content: 0, // 신고 시스템 구현 필요
        },
      },
      charts: {
        user_growth: await this.getUserGrowthDataDetailed(30),
        revenue_trend: await this.getRevenueTrendDetailed(30),
        consultation_stats: await this.getConsultationStatsData(30),
        category_distribution: categoryDistribution,
        expert_level_distribution: expertLevelDistribution,
        rating_distribution: await this.getRatingDistribution(),
      },
      recentActivity: {
        recent_users: recentUsers,
        recent_applications: recentApplications,
        recent_reservations: recentReservations,
        recent_reviews: await this.getRecentReviews(5),
        system_alerts: [], // 시스템 알림 구현 필요
      },
    }
  }

  // ==================== Enhanced Helper Methods ====================

  private async getTodayConsultationCount(): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return this.prisma.reservation.count({
      where: {
        startAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    })
  }

  private async getTodayRevenue(): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const result = await this.prisma.reservation.aggregate({
      where: {
        status: 'CONFIRMED',
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      _sum: {
        cost: true,
      },
    })

    return result._sum.cost || 0
  }

  private async getWeekRevenue(): Promise<number> {
    const today = new Date()
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    const result = await this.prisma.reservation.aggregate({
      where: {
        status: 'CONFIRMED',
        createdAt: {
          gte: weekAgo,
          lt: today,
        },
      },
      _sum: {
        cost: true,
      },
    })

    return result._sum.cost || 0
  }

  private async getMonthRevenue(): Promise<number> {
    const today = new Date()
    const monthAgo = new Date(today)
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    const result = await this.prisma.reservation.aggregate({
      where: {
        status: 'CONFIRMED',
        createdAt: {
          gte: monthAgo,
          lt: today,
        },
      },
      _sum: {
        cost: true,
      },
    })

    return result._sum.cost || 0
  }

  private async getApprovalRate(): Promise<number> {
    const total = await this.prisma.expertApplication.count()
    const approved = await this.prisma.expertApplication.count({
      where: { status: 'APPROVED' }
    })

    return total > 0 ? Math.round((approved / total) * 100) : 0
  }

  private async getRecentUsers(limit: number) {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        avatarUrl: true,
      },
    })

    return users.map(user => ({
      id: user.id,
      name: user.name || '이름 없음',
      email: user.email,
      created_at: user.createdAt.toISOString(),
      avatar_url: user.avatarUrl,
    }))
  }

  private async getRecentApplicationsDetailed(limit: number) {
    const applications = await this.prisma.expertApplication.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        specialty: true,
        status: true,
        createdAt: true,
      },
    })

    return applications.map(app => ({
      id: app.id,
      name: app.name,
      specialty: app.specialty,
      status: app.status,
      created_at: app.createdAt.toISOString(),
    }))
  }

  private async getRecentReservationsDetailed(limit: number) {
    const reservations = await this.prisma.reservation.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { name: true } },
        expert: { select: { name: true } },
      },
    })

    return reservations.map(res => ({
      id: res.id,
      user_name: res.user.name || '이름 없음',
      expert_name: res.expert.name,
      start_at: res.startAt.toISOString(),
      status: res.status,
      cost: res.cost,
    }))
  }

  private async getRecentReviews(limit: number) {
    const reviews = await this.prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { name: true } },
        expert: { select: { name: true } },
      },
    })

    return reviews.map(review => ({
      id: review.id,
      user_name: review.user.name || '이름 없음',
      expert_name: review.expert.name,
      rating: review.rating,
      content: review.content,
      created_at: review.createdAt.toISOString(),
    }))
  }

  private async getUserGrowthDataDetailed(days: number) {
    const data = []
    const today = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const newUsers = await this.getUserCount(date, nextDate)
      const totalUsers = await this.prisma.user.count({
        where: { createdAt: { lt: nextDate } },
      })

      data.push({
        date: date.toISOString().split('T')[0],
        total_users: totalUsers,
        new_users: newUsers,
        active_users: 0, // 계산 필요시 추가
      })
    }

    return data
  }

  private async getRevenueTrendDetailed(days: number) {
    const data = []
    const today = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const revenue = await this.getRevenue(date, nextDate)
      const transactions = await this.getReservationCount(date, nextDate)

      data.push({
        date: date.toISOString().split('T')[0],
        revenue,
        transactions,
      })
    }

    return data
  }

  private async getConsultationStatsData(days: number) {
    const data = []
    const today = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const completed = await this.getCompletedReservationCount(date, nextDate)
      const canceled = await this.getCanceledReservationCount(date, nextDate)
      const pending = await this.prisma.reservation.count({
        where: {
          status: 'PENDING',
          createdAt: { gte: date, lt: nextDate },
        },
      })

      data.push({
        date: date.toISOString().split('T')[0],
        completed,
        canceled,
        pending,
      })
    }

    return data
  }

  private async getCategoryDistribution() {
    const categories = await this.prisma.category.findMany({
      include: {
        expertLinks: true,
      },
    })

    return categories.map(cat => ({
      category: cat.nameKo,
      count: cat.expertLinks.length,
      revenue: 0, // 카테고리별 매출 계산 필요시 추가
    }))
  }

  private async getExpertLevelDistribution() {
    const experts = await this.prisma.expert.groupBy({
      by: ['level'],
      _count: {
        level: true,
      },
    })

    return experts.map(e => ({
      level: e.level,
      count: e._count.level,
    }))
  }

  private async getRatingDistribution() {
    const reviews = await this.prisma.review.groupBy({
      by: ['rating'],
      _count: {
        rating: true,
      },
    })

    return reviews.map(r => ({
      rating: r.rating,
      count: r._count.rating,
    }))
  }

  /**
   * DailyMetrics 조회
   */
  async getDailyMetrics(startDate: Date, endDate: Date) {
    return this.prisma.dailyMetrics.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    })
  }

  /**
   * 전문가 지원 퍼널 통계
   */
  async getExpertFunnel() {
    const [total, pending, approved, rejected] = await Promise.all([
      this.prisma.expertApplication.count(),
      this.prisma.expertApplication.count({ where: { status: 'PENDING' } }),
      this.prisma.expertApplication.count({ where: { status: 'APPROVED' } }),
      this.prisma.expertApplication.count({ where: { status: 'REJECTED' } }),
    ])

    return {
      total,
      pending,
      approved,
      rejected,
      conversionRate: total > 0 ? ((approved / total) * 100).toFixed(1) : '0',
    }
  }

  /**
   * 매일 자정에 DailyMetrics 집계 (크론잡)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async aggregateDailyMetrics() {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)

    const today = new Date(yesterday)
    today.setDate(today.getDate() + 1)

    console.log(`[DailyMetrics] Aggregating for ${yesterday.toISOString().split('T')[0]}`)

    // 어제 데이터 집계
    const [
      newUsers,
      newApplications,
      approvedExperts,
      rejectedExperts,
      reservations,
      completedReservations,
      canceledReservations,
      revenue,
      reviews,
      avgRating,
    ] = await Promise.all([
      this.getUserCount(yesterday, today),
      this.getApplicationCount(yesterday, today),
      this.getApprovedExpertCount(yesterday, today),
      this.getRejectedExpertCount(yesterday, today),
      this.getReservationCount(yesterday, today),
      this.getCompletedReservationCount(yesterday, today),
      this.getCanceledReservationCount(yesterday, today),
      this.getRevenue(yesterday, today),
      this.getReviewCount(yesterday, today),
      this.getAverageRating(yesterday, today),
    ])

    const activeUsers = await this.getActiveUserCount(1, yesterday)

    // DailyMetrics 생성 또는 업데이트
    await this.prisma.dailyMetrics.upsert({
      where: { date: yesterday },
      create: {
        date: yesterday,
        newUsers,
        newExpertApplications: newApplications,
        approvedExperts,
        rejectedExperts,
        totalReservations: reservations,
        completedReservations,
        canceledReservations,
        totalRevenue: revenue,
        avgReservationValue: reservations > 0 ? revenue / reservations : 0,
        activeUsers,
        newReviews: reviews,
        avgRating,
      },
      update: {
        newUsers,
        newExpertApplications: newApplications,
        approvedExperts,
        rejectedExperts,
        totalReservations: reservations,
        completedReservations,
        canceledReservations,
        totalRevenue: revenue,
        avgReservationValue: reservations > 0 ? revenue / reservations : 0,
        activeUsers,
        newReviews: reviews,
        avgRating,
      },
    })

    console.log(`[DailyMetrics] Aggregation complete for ${yesterday.toISOString().split('T')[0]}`)
  }

  // ==================== Private Helper Methods ====================

  private getPeriodStart(from: Date, period: 'day' | 'week' | 'month'): Date {
    const start = new Date(from)

    if (period === 'day') {
      start.setDate(start.getDate() - 1)
    } else if (period === 'week') {
      start.setDate(start.getDate() - 7)
    } else if (period === 'month') {
      start.setMonth(start.getMonth() - 1)
    }

    start.setHours(0, 0, 0, 0)
    return start
  }

  private calculateChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  private async getUserCount(start: Date, end: Date): Promise<number> {
    return this.prisma.user.count({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
    })
  }

  private async getApplicationCount(start: Date, end: Date): Promise<number> {
    return this.prisma.expertApplication.count({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
    })
  }

  private async getApprovedExpertCount(start: Date, end: Date): Promise<number> {
    return this.prisma.expertApplication.count({
      where: {
        status: 'APPROVED',
        reviewedAt: {
          gte: start,
          lt: end,
        },
      },
    })
  }

  private async getRejectedExpertCount(start: Date, end: Date): Promise<number> {
    return this.prisma.expertApplication.count({
      where: {
        status: 'REJECTED',
        reviewedAt: {
          gte: start,
          lt: end,
        },
      },
    })
  }

  private async getReservationCount(start: Date, end: Date): Promise<number> {
    return this.prisma.reservation.count({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
    })
  }

  private async getCompletedReservationCount(start: Date, end: Date): Promise<number> {
    return this.prisma.reservation.count({
      where: {
        status: 'CONFIRMED',
        createdAt: {
          gte: start,
          lt: end,
        },
      },
    })
  }

  private async getCanceledReservationCount(start: Date, end: Date): Promise<number> {
    return this.prisma.reservation.count({
      where: {
        status: 'CANCELED',
        createdAt: {
          gte: start,
          lt: end,
        },
      },
    })
  }

  private async getRevenue(start: Date, end: Date): Promise<number> {
    const result = await this.prisma.reservation.aggregate({
      where: {
        status: 'CONFIRMED',
        createdAt: {
          gte: start,
          lt: end,
        },
      },
      _sum: {
        cost: true,
      },
    })

    return result._sum.cost || 0
  }

  private async getReviewCount(start: Date, end: Date): Promise<number> {
    return this.prisma.review.count({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
    })
  }

  private async getAverageRating(start: Date, end: Date): Promise<number> {
    const result = await this.prisma.review.aggregate({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
      _avg: {
        rating: true,
      },
    })

    return result._avg.rating || 0
  }

  private async getActiveUserCount(days: number, until?: Date): Promise<number> {
    const endDate = until || new Date()
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - days)

    // 최근 N일 이내 예약을 생성한 사용자 수
    const users = await this.prisma.reservation.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    })

    return users.length
  }

  private async getUserGrowthData(days: number) {
    const data: Array<{ date: string; users: number }> = []
    const today = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const count = await this.getUserCount(date, nextDate)

      data.push({
        date: date.toISOString().split('T')[0],
        users: count,
      })
    }

    return data
  }

  private async getRevenueByDay(days: number) {
    const data: Array<{ date: string; revenue: number }> = []
    const today = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const revenue = await this.getRevenue(date, nextDate)

      data.push({
        date: date.toISOString().split('T')[0],
        revenue,
      })
    }

    return data
  }

  private async getApplicationsByStatus() {
    const [pending, approved, rejected] = await Promise.all([
      this.prisma.expertApplication.count({ where: { status: 'PENDING' } }),
      this.prisma.expertApplication.count({ where: { status: 'APPROVED' } }),
      this.prisma.expertApplication.count({ where: { status: 'REJECTED' } }),
    ])

    return [
      { name: '대기중', value: pending },
      { name: '승인됨', value: approved },
      { name: '거절됨', value: rejected },
    ]
  }

  private async getRecentActivity(limit: number) {
    const recentApplications = await this.prisma.expertApplication.findMany({
      where: {
        reviewedAt: { not: null },
      },
      orderBy: { reviewedAt: 'desc' },
      take: limit,
      select: {
        name: true,
        status: true,
        reviewedAt: true,
      },
    })

    return recentApplications.map((app) => ({
      type: app.status === 'APPROVED' ? 'approval' : 'rejection',
      message: `${app.name}님의 지원이 ${app.status === 'APPROVED' ? '승인' : '거절'}되었습니다`,
      timestamp: app.reviewedAt!.toISOString(),
    }))
  }
}
