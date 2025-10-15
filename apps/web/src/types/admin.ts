// 관리자 대시보드 타입 정의

export interface DashboardMetrics {
  users: {
    total: number
    new_today: number
    active_users: number
    growth_rate: number
  }
  experts: {
    total: number
    active: number
    pending_applications: number
    additional_info_requested: number
    approved_applications: number
    rejected_applications: number
    approval_rate: number
  }
  consultations: {
    total: number
    today: number
    pending: number
    completed: number
    canceled: number
    completion_rate: number
  }
  revenue: {
    today: number
    this_week: number
    this_month: number
    growth: number
    avg_transaction: number
  }
  community: {
    total_posts: number
    total_comments: number
    pending_review: number
    reported_content: number
  }
}

export interface ChartDataPoint {
  date: string
  [key: string]: string | number
}

export interface UserGrowthData {
  date: string
  total_users: number
  new_users: number
  active_users: number
}

export interface RevenueData {
  date: string
  revenue: number
  transactions: number
}

export interface ConsultationStatsData {
  date: string
  completed: number
  canceled: number
  pending: number
}

export interface CategoryDistribution {
  category: string
  count: number
  revenue: number
}

export interface ExpertLevelDistribution {
  level: string
  count: number
}

export interface RatingDistribution {
  rating: number
  count: number
}

export interface ChartData {
  user_growth: UserGrowthData[]
  revenue_trend: RevenueData[]
  consultation_stats: ConsultationStatsData[]
  category_distribution: CategoryDistribution[]
  expert_level_distribution: ExpertLevelDistribution[]
  rating_distribution: RatingDistribution[]
}

export interface RecentUser {
  id: number
  name: string
  email: string
  created_at: string
  avatar_url: string | null
}

export interface RecentApplication {
  id: number
  name: string
  specialty: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  created_at: string
}

export interface RecentReservation {
  id: number
  user_name: string
  expert_name: string
  start_at: string
  status: string
  cost: number
}

export interface RecentReview {
  id: number
  user_name: string
  expert_name: string
  rating: number
  content: string
  created_at: string
}

export interface SystemAlert {
  id: number
  type: 'error' | 'warning' | 'info' | 'success'
  message: string
  timestamp: string
}

export interface RecentActivity {
  recent_users: RecentUser[]
  recent_applications: RecentApplication[]
  recent_reservations: RecentReservation[]
  recent_reviews: RecentReview[]
  system_alerts: SystemAlert[]
}

export interface DashboardData {
  summary: DashboardMetrics
  charts: ChartData
  recentActivity: RecentActivity
}

export type PeriodType = 'day' | 'week' | 'month'
