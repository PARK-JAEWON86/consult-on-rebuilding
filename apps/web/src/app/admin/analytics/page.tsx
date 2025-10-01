'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { AnalyticsData, AnalyticsPeriod } from '@/types/analytics'
import { TrendingUp, Users, DollarSign, Calendar, AlertCircle } from 'lucide-react'

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d')

  useEffect(() => {
    loadAnalyticsData()
  }, [period])

  async function loadAnalyticsData() {
    try {
      setIsLoading(true)
      const response = await api.get<AnalyticsData>(
        '/admin/analytics/detailed',
        { params: { period } }
      )

      if (response.success && response.data) {
        setData(response.data)
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error)
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
          onClick={loadAnalyticsData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          다시 시도
        </button>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return `₩${(amount / 10000).toFixed(0)}만`
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString('ko-KR')
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">상세 분석</h1>
          <p className="text-sm text-gray-600 mt-1">비즈니스 인사이트와 데이터 분석</p>
        </div>

        {/* 기간 필터 */}
        <div className="flex gap-2">
          {(['7d', '30d', '90d', '1y'] as AnalyticsPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === p
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              {p === '7d' ? '7일' : p === '30d' ? '30일' : p === '90d' ? '90일' : '1년'}
            </button>
          ))}
        </div>
      </div>

      {/* 알림 및 인사이트 */}
      {data.insights.alerts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            주요 알림
          </h2>
          <div className="space-y-3">
            {data.insights.alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${
                  alert.type === 'error'
                    ? 'bg-red-50 border-red-200'
                    : alert.type === 'warning'
                    ? 'bg-yellow-50 border-yellow-200'
                    : alert.type === 'success'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      alert.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : alert.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {alert.priority === 'high' ? '높음' : alert.priority === 'medium' ? '중간' : '낮음'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 핵심 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 매출</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(data.revenue.total_revenue)}
              </p>
              <p
                className={`text-sm mt-1 ${
                  data.revenue.revenue_growth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {data.revenue.revenue_growth >= 0 ? '+' : ''}
                {data.revenue.revenue_growth.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">활성 사용자</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatNumber(data.users.mau)}
              </p>
              <p className="text-sm text-gray-500 mt-1">DAU/MAU: {data.users.dau_mau_ratio}%</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 상담</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatNumber(data.consultations.total_consultations)}
              </p>
              <p
                className={`text-sm mt-1 ${
                  data.consultations.consultation_growth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {data.consultations.consultation_growth >= 0 ? '+' : ''}
                {data.consultations.consultation_growth.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">평균 평점</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data.quality.avg_rating.toFixed(1)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                완료율: {data.consultations.completion_rate.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 매출 분석 섹션 */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">월별 매출 추이</h2>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <p>차트 컴포넌트가 여기에 표시됩니다</p>
        </div>
      </div>

      {/* Top 전문가 */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 전문가 (매출 기준)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">순위</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">전문가</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">카테고리</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">매출</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">상담 수</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">평점</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">완료율</th>
              </tr>
            </thead>
            <tbody>
              {data.experts.top_experts.map((expert) => (
                <tr key={expert.expert_id} className="border-b border-gray-100">
                  <td className="px-4 py-3 text-sm">
                    <span className="font-bold text-blue-600">#{expert.rank}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {expert.expert_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{expert.category}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                    {formatCurrency(expert.revenue)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600">
                    {expert.consultation_count}건
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <span className="text-yellow-600">★ {expert.avg_rating.toFixed(1)}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600">
                    {expert.completion_rate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 카테고리별 매출 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">카테고리별 매출</h2>
          <div className="space-y-3">
            {data.revenue.category_revenue.slice(0, 8).map((cat) => (
              <div key={cat.category} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(cat.revenue)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <span className="ml-4 text-sm text-gray-500">{Math.floor(cat.percentage * 10) / 10}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">상담 유형 분포</h2>
          <div className="space-y-4">
            {data.consultations.type_distribution.map((type) => (
              <div key={type.type}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {type.type === 'VIDEO' ? '비디오 상담' : type.type === 'VOICE' ? '음성 상담' : '텍스트 상담'}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {type.count}건 ({type.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      type.type === 'VIDEO'
                        ? 'bg-green-600'
                        : type.type === 'VOICE'
                        ? 'bg-blue-600'
                        : 'bg-purple-600'
                    }`}
                    style={{ width: `${type.percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">평균 시간: {type.avg_duration}분</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 전환 퍼널 */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">전환율 퍼널</h2>
        <div className="flex items-center justify-between space-x-4">
          {data.users.conversion_funnel.map((stage, idx) => (
            <div key={stage.stage} className="flex-1">
              <div className="relative">
                <div
                  className={`p-4 rounded-lg text-center ${
                    idx === 0
                      ? 'bg-blue-100'
                      : idx === 1
                      ? 'bg-blue-200'
                      : idx === 2
                      ? 'bg-blue-300'
                      : 'bg-blue-400'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-700">{stage.stage}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatNumber(stage.users)}
                  </p>
                  {idx > 0 && (
                    <p className="text-xs text-gray-600 mt-1">{stage.conversion_rate}%</p>
                  )}
                </div>
                {idx < data.users.conversion_funnel.length - 1 && (
                  <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 text-gray-400">
                    →
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 평점 분포 */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">평점 분포</h2>
        <div className="space-y-3">
          {data.quality.rating_distribution.reverse().map((rating) => (
            <div key={rating.rating} className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700 w-12">{rating.rating}점</span>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-6">
                  <div
                    className="bg-yellow-500 h-6 rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${rating.percentage}%` }}
                  >
                    <span className="text-xs font-medium text-white">{Math.floor(rating.percentage * 10) / 10}%</span>
                  </div>
                </div>
              </div>
              <span className="text-sm text-gray-600 w-16 text-right">{rating.count}개</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
