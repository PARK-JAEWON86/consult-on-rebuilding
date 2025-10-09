'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import {
  Users,
  UserCheck,
  TrendingUp,
  DollarSign,
  Calendar,
  MessageSquare,
  Activity,
  Award
} from 'lucide-react'
import MetricCard from '@/components/admin/dashboard/MetricCard'
import QuickActions from '@/components/admin/dashboard/QuickActions'
import RecentActivity from '@/components/admin/dashboard/RecentActivity'
import UserGrowthChart from '@/components/admin/dashboard/UserGrowthChart'
import RevenueChart from '@/components/admin/dashboard/RevenueChart'
import ApplicationStatusChart from '@/components/admin/dashboard/ApplicationStatusChart'
import type { DashboardData, PeriodType } from '@/types/admin'

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<PeriodType>('day')

  useEffect(() => {
    loadDashboardData()
  }, [period])

  async function loadDashboardData() {
    try {
      setIsLoading(true)
      console.log('Fetching dashboard data...')

      const response = await api.get<DashboardData>(
        '/admin/analytics/dashboard-enhanced',
        { params: { period } }
      )
      console.log('Dashboard data loaded successfully:', response.data)
      setData(response.data || null)
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error)
      console.error('Error details:', {
        message: error.message,
        status: error.status,
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">데이터를 불러올 수 없습니다.</p>
        <button
          onClick={loadDashboardData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          다시 시도
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
          <p className="text-sm text-gray-600 mt-1">플랫폼 전체 현황을 한눈에 확인하세요</p>
        </div>

        {/* 기간 필터 */}
        <div className="flex gap-2">
          {(['day', 'week', 'month'] as PeriodType[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === p
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              {p === 'day' ? '오늘' : p === 'week' ? '이번 주' : '이번 달'}
            </button>
          ))}
        </div>
      </div>

      {/* 빠른 액션 */}
      <QuickActions
        pendingApplications={data.summary.experts.pending_applications}
        reportedContent={data.summary.community.reported_content}
      />

      {/* 핵심 지표 카드 - 8개 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="신규 사용자"
          value={data.summary.users.new_today}
          change={data.summary.users.growth_rate}
          icon={Users}
          color="blue"
          unit="명"
          loading={isLoading}
        />
        <MetricCard
          title="활성 전문가"
          value={data.summary.experts.active}
          icon={UserCheck}
          color="green"
          unit="명"
          loading={isLoading}
        />
        <MetricCard
          title="오늘 상담"
          value={data.summary.consultations.today}
          icon={Calendar}
          color="purple"
          unit="건"
          loading={isLoading}
        />
        <MetricCard
          title="오늘 매출"
          value={`₩${(data.summary.revenue.today / 10000).toFixed(0)}`}
          change={data.summary.revenue.growth}
          icon={DollarSign}
          color="indigo"
          unit="만원"
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="총 사용자"
          value={data.summary.users.total}
          icon={Users}
          color="blue"
          loading={isLoading}
        />
        <MetricCard
          title="대기 중 지원"
          value={data.summary.experts.pending_applications}
          icon={Activity}
          color="yellow"
          loading={isLoading}
        />
        <MetricCard
          title="완료율"
          value={data.summary.consultations.completion_rate}
          icon={Award}
          color="green"
          unit="%"
          loading={isLoading}
        />
        <MetricCard
          title="커뮤니티 활동"
          value={data.summary.community.total_posts + data.summary.community.total_comments}
          icon={MessageSquare}
          color="purple"
          loading={isLoading}
        />
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserGrowthChart data={data.charts.user_growth} />
        <RevenueChart data={data.charts.revenue_trend} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ApplicationStatusChart data={[
          { name: '대기중', value: data.summary.experts.pending_applications },
          { name: '승인됨', value: data.summary.experts.total - data.summary.experts.pending_applications },
        ]} />

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">카테고리별 전문가</h2>
          <div className="space-y-3">
            {data.charts.category_distribution.slice(0, 6).map((cat) => (
              <div key={cat.category} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{cat.category}</span>
                <span className="text-sm font-semibold text-gray-900">{cat.count}명</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 최근 활동 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentActivity
          type="users"
          users={data.recentActivity.recent_users}
        />
        <RecentActivity
          type="applications"
          applications={data.recentActivity.recent_applications}
        />
        <RecentActivity
          type="reservations"
          reservations={data.recentActivity.recent_reservations}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity
          type="reviews"
          reviews={data.recentActivity.recent_reviews}
        />
        <RecentActivity
          type="alerts"
          alerts={data.recentActivity.system_alerts}
        />
      </div>
    </div>
  )
}
