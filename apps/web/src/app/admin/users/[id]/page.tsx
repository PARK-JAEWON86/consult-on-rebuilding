'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Mail, Phone, Calendar, Shield, Star, DollarSign, Activity } from 'lucide-react'
import { api } from '@/lib/api'

interface Expert {
  id: number
  displayId: string
  name: string
  bio: string
  hourlyRate: number
  isActive: boolean
  rating: number
  totalReviews: number
  totalReservations: number
  createdAt: string
}

interface Reservation {
  id: number
  scheduledAt: string
  status: string
  cost: number
  createdAt: string
  expert: {
    name: string
    displayId: string
  }
}

interface Review {
  id: number
  rating: number
  comment: string
  createdAt: string
  expert: {
    name: string
    displayId: string
  }
}

interface User {
  id: number
  email: string
  name: string
  roles: string
  avatarUrl: string | null
  createdAt: string
  emailVerifiedAt: string | null
  phoneNumber: string | null
  phoneVerified: boolean
  expert: Expert | null
  reservations: Reservation[]
  reviews: Review[]
}

interface UserStats {
  totalReservations: number
  totalSpent: number
  totalReviews: number
  lastActive: string | null
}

interface UserDetailResponse {
  user: User
  stats: UserStats
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [data, setData] = useState<UserDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadUserDetail()
  }, [userId])

  async function loadUserDetail() {
    try {
      setIsLoading(true)
      const response = await api.get<UserDetailResponse>(`/admin/users/${userId}`)
      setData(response.data)
    } catch (error) {
      console.error('Failed to load user detail:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function getRoles(rolesJson: string): string[] {
    try {
      return JSON.parse(rolesJson)
    } catch {
      return [rolesJson]
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
        <p className="text-gray-500">사용자를 찾을 수 없습니다.</p>
      </div>
    )
  }

  const { user, stats } = data
  const roles = getRoles(user.roles)

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/users')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          사용자 목록으로 돌아가기
        </button>
        <h1 className="text-3xl font-bold text-gray-900">사용자 상세</h1>
      </div>

      {/* 기본 정보 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start gap-6">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-24 h-24 rounded-full"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-600 font-medium text-2xl">
                {user.name?.charAt(0) || '?'}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{user.name}</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
                {user.emailVerifiedAt && (
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded">
                    인증됨
                  </span>
                )}
              </div>
              {user.phoneNumber && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{user.phoneNumber}</span>
                  {user.phoneVerified && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded">
                      인증됨
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>가입일: {new Date(user.createdAt).toLocaleDateString('ko-KR')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-600" />
                <div className="flex gap-1">
                  {roles.map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-gray-900">총 예약</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalReservations}건</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="font-medium text-gray-900">총 지출</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">₩{stats.totalSpent.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-5 h-5 text-yellow-600" />
            <h3 className="font-medium text-gray-900">작성 리뷰</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalReviews}개</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-purple-600" />
            <h3 className="font-medium text-gray-900">최근 활동</h3>
          </div>
          <p className="text-sm text-gray-600">
            {stats.lastActive
              ? new Date(stats.lastActive).toLocaleDateString('ko-KR')
              : '활동 없음'}
          </p>
        </div>
      </div>

      {/* 전문가 정보 */}
      {user.expert && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">전문가 정보</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">전문가 ID:</span>
              <span className="font-medium">{user.expert.displayId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">시간당 요금:</span>
              <span className="font-medium">₩{user.expert.hourlyRate?.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">평점:</span>
              <span className="font-medium">{user.expert.rating?.toFixed(1)} ⭐</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">총 리뷰:</span>
              <span className="font-medium">{user.expert.totalReviews}개</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">총 예약:</span>
              <span className="font-medium">{user.expert.totalReservations}건</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">상태:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                user.expert.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {user.expert.isActive ? '활성' : '비활성'}
              </span>
            </div>
            {user.expert.bio && (
              <div>
                <span className="text-gray-600 block mb-1">소개:</span>
                <p className="text-gray-900">{user.expert.bio}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 최근 예약 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">최근 예약 (최근 10개)</h3>
        {user.reservations.length > 0 ? (
          <div className="space-y-3">
            {user.reservations.map((reservation) => (
              <div
                key={reservation.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-gray-900">{reservation.expert.name}</p>
                  <p className="text-sm text-gray-600">
                    예약일: {new Date(reservation.scheduledAt).toLocaleString('ko-KR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">₩{reservation.cost.toLocaleString()}</p>
                  <span className={`text-xs px-2 py-1 rounded ${
                    reservation.status === 'CONFIRMED'
                      ? 'bg-green-100 text-green-800'
                      : reservation.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {reservation.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">예약 내역이 없습니다.</p>
        )}
      </div>

      {/* 최근 리뷰 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">작성한 리뷰 (최근 10개)</h3>
        {user.reviews.length > 0 ? (
          <div className="space-y-4">
            {user.reviews.map((review) => (
              <div
                key={review.id}
                className="p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{review.expert.name}</p>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <p className="text-gray-700">{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">작성한 리뷰가 없습니다.</p>
        )}
      </div>
    </div>
  )
}
