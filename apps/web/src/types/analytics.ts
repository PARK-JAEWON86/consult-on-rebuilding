// 분석 페이지 타입 정의

export interface RevenueAnalytics {
  total_revenue: number
  revenue_growth: number // percentage
  avg_consultation_fee: number
  monthly_revenue: Array<{
    month: string
    revenue: number
    consultation_count: number
    avg_fee: number
  }>
  category_revenue: Array<{
    category: string
    revenue: number
    percentage: number
    growth: number
  }>
  expert_revenue: Array<{
    expert_id: number
    expert_name: string
    revenue: number
    consultation_count: number
    avg_rating: number
  }>
}

export interface UserBehaviorAnalytics {
  dau: number // Daily Active Users
  mau: number // Monthly Active Users
  dau_mau_ratio: number // percentage
  avg_session_duration: number // minutes
  bounce_rate: number // percentage
  retention_rate: number // percentage
  traffic_sources: Array<{
    source: string
    users: number
    percentage: number
  }>
  conversion_funnel: Array<{
    stage: string
    users: number
    conversion_rate: number
  }>
  cohort_data: Array<{
    cohort: string
    week_0: number
    week_1: number
    week_2: number
    week_3: number
    week_4: number
  }>
}

export interface ExpertPerformanceAnalytics {
  top_experts: Array<{
    rank: number
    expert_id: number
    expert_name: string
    category: string
    revenue: number
    consultation_count: number
    avg_rating: number
    completion_rate: number
    response_rate: number
  }>
  expert_level_distribution: Array<{
    level: string
    count: number
    percentage: number
  }>
  new_expert_performance: {
    avg_7day_revenue: number
    avg_7day_consultations: number
    avg_30day_revenue: number
    avg_30day_consultations: number
  }
}

export interface ConsultationAnalytics {
  total_consultations: number
  consultation_growth: number // percentage
  completion_rate: number
  cancellation_rate: number
  type_distribution: Array<{
    type: 'VIDEO' | 'VOICE' | 'TEXT'
    count: number
    percentage: number
    avg_duration: number
  }>
  time_heatmap: Array<{
    day: string
    hour: number
    count: number
  }>
  category_demand: Array<{
    category: string
    count: number
    growth: number
    avg_wait_time: number // hours
  }>
  peak_hours: Array<{
    hour: number
    count: number
  }>
}

export interface QualityAnalytics {
  avg_rating: number
  rating_trend: number // percentage change
  rating_distribution: Array<{
    rating: number
    count: number
    percentage: number
  }>
  cancellation_reasons: Array<{
    reason: string
    count: number
    percentage: number
  }>
  reported_content: {
    total: number
    pending: number
    resolved: number
    avg_resolution_time: number // hours
  }
  low_rating_consultations: Array<{
    consultation_id: number
    expert_name: string
    user_name: string
    rating: number
    reason: string
    created_at: string
  }>
}

export interface AnalyticsInsights {
  alerts: Array<{
    type: 'warning' | 'info' | 'success' | 'error'
    title: string
    message: string
    priority: 'high' | 'medium' | 'low'
    timestamp: string
  }>
  recommendations: Array<{
    category: string
    title: string
    description: string
    impact: 'high' | 'medium' | 'low'
  }>
}

export interface AnalyticsData {
  revenue: RevenueAnalytics
  users: UserBehaviorAnalytics
  experts: ExpertPerformanceAnalytics
  consultations: ConsultationAnalytics
  quality: QualityAnalytics
  insights: AnalyticsInsights
}

export type AnalyticsPeriod = '7d' | '30d' | '90d' | '1y'
