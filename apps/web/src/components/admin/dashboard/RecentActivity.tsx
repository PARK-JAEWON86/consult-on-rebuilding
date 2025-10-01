'use client'

import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  UserPlus,
  UserCheck,
  Calendar,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import type {
  RecentUser,
  RecentApplication,
  RecentReservation,
  RecentReview,
  SystemAlert,
} from '@/types/admin'

interface RecentActivityProps {
  users?: RecentUser[]
  applications?: RecentApplication[]
  reservations?: RecentReservation[]
  reviews?: RecentReview[]
  alerts?: SystemAlert[]
  type: 'users' | 'applications' | 'reservations' | 'reviews' | 'alerts'
}

export default function RecentActivity({
  users = [],
  applications = [],
  reservations = [],
  reviews = [],
  alerts = [],
  type,
}: RecentActivityProps) {
  const getTitle = () => {
    switch (type) {
      case 'users':
        return '최근 가입자'
      case 'applications':
        return '대기 중인 지원'
      case 'reservations':
        return '최근 예약'
      case 'reviews':
        return '최근 리뷰'
      case 'alerts':
        return '시스템 알림'
    }
  }

  const getIcon = (itemType: string) => {
    switch (itemType) {
      case 'user':
        return <UserPlus className="w-4 h-4" />
      case 'application':
        return <UserCheck className="w-4 h-4" />
      case 'reservation':
        return <Calendar className="w-4 h-4" />
      case 'review':
        return <Star className="w-4 h-4" />
      case 'alert':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: { label: '대기중', color: 'bg-yellow-100 text-yellow-800' },
      APPROVED: { label: '승인됨', color: 'bg-green-100 text-green-800' },
      REJECTED: { label: '거절됨', color: 'bg-red-100 text-red-800' },
      CONFIRMED: { label: '확정', color: 'bg-blue-100 text-blue-800' },
      CANCELED: { label: '취소', color: 'bg-gray-100 text-gray-800' },
    }

    const badge = badges[status as keyof typeof badges]
    if (!badge) return null

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ko,
      })
    } catch {
      return dateString
    }
  }

  const renderContent = () => {
    if (type === 'users' && users.length > 0) {
      return users.map((user) => (
        <div key={user.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
          <div className="flex-shrink-0 mt-1">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-blue-600" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
            <p className="text-xs text-gray-400 mt-1">{formatTime(user.created_at)}</p>
          </div>
        </div>
      ))
    }

    if (type === 'applications' && applications.length > 0) {
      return applications.map((app) => (
        <div key={app.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
          <div className="flex-shrink-0 mt-1">
            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-yellow-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-gray-900 truncate">{app.name}</p>
              {getStatusBadge(app.status)}
            </div>
            <p className="text-xs text-gray-500 truncate">{app.specialty}</p>
            <p className="text-xs text-gray-400 mt-1">{formatTime(app.created_at)}</p>
          </div>
        </div>
      ))
    }

    if (type === 'reservations' && reservations.length > 0) {
      return reservations.map((res) => (
        <div key={res.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
          <div className="flex-shrink-0 mt-1">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-gray-900 truncate">
                {res.user_name} → {res.expert_name}
              </p>
              {getStatusBadge(res.status)}
            </div>
            <p className="text-xs text-gray-500">₩{res.cost.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">{formatTime(res.start_at)}</p>
          </div>
        </div>
      ))
    }

    if (type === 'reviews' && reviews.length > 0) {
      return reviews.map((review) => (
        <div key={review.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
          <div className="flex-shrink-0 mt-1">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <Star className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900 truncate">{review.user_name}</p>
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 line-clamp-2 mt-1">{review.content}</p>
            <p className="text-xs text-gray-400 mt-1">{formatTime(review.created_at)}</p>
          </div>
        </div>
      ))
    }

    if (type === 'alerts' && alerts.length > 0) {
      return alerts.map((alert) => (
        <div key={alert.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
          <div className="flex-shrink-0 mt-1">
            {alert.type === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
            {alert.type === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-500" />}
            {alert.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-500" />}
            {alert.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">{alert.message}</p>
            <p className="text-xs text-gray-400 mt-1">{formatTime(alert.timestamp)}</p>
          </div>
        </div>
      ))
    }

    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        표시할 활동이 없습니다.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">{getTitle()}</h2>
      </div>

      <div className="p-3 max-h-[400px] overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  )
}
