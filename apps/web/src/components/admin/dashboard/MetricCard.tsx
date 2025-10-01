'use client'

import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: number | string
  change?: number
  icon: LucideIcon
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'indigo'
  unit?: string
  trend?: 'up' | 'down' | 'neutral'
  loading?: boolean
}

export default function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  unit,
  trend,
  loading = false,
}: MetricCardProps) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-500',
      text: 'text-blue-600',
      lightBg: 'bg-blue-50',
    },
    green: {
      bg: 'bg-green-500',
      text: 'text-green-600',
      lightBg: 'bg-green-50',
    },
    yellow: {
      bg: 'bg-yellow-500',
      text: 'text-yellow-600',
      lightBg: 'bg-yellow-50',
    },
    purple: {
      bg: 'bg-purple-500',
      text: 'text-purple-600',
      lightBg: 'bg-purple-50',
    },
    red: {
      bg: 'bg-red-500',
      text: 'text-red-600',
      lightBg: 'bg-red-50',
    },
    indigo: {
      bg: 'bg-indigo-500',
      text: 'text-indigo-600',
      lightBg: 'bg-indigo-50',
    },
  }

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600'
    if (trend === 'down') return 'text-red-600'
    return 'text-gray-600'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className={`${colorClasses[color].bg} p-2.5 rounded-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
            {unit && <span className="text-xl text-gray-600 ml-1">{unit}</span>}
          </p>

          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-sm font-medium ${getTrendColor()}`}>
                {change > 0 ? '+' : ''}
                {change}%
              </span>
              <span className="text-xs text-gray-500">vs 이전 기간</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
