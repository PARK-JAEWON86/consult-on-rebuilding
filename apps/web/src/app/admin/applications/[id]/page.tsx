'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Mail,
  Briefcase,
  Calendar,
  FileText,
  Clock
} from 'lucide-react'
import StatusBadge from '@/components/admin/common/StatusBadge'

interface ApplicationDetail {
  application: {
    id: number
    displayId: string
    name: string
    email: string
    jobTitle: string
    specialty: string
    experienceYears: number
    bio: string
    keywords: string[]
    consultationTypes: string[]
    availability: any
    certifications: any[]
    profileImage: string | null
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
    reviewedAt: string | null
    reviewNotes: string | null
    createdAt: string
  }
  user: {
    id: number
    email: string
    name: string
    createdAt: string
    phoneNumber: string | null
  }
  previousApplications: any[]
}

export default function ApplicationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [data, setData] = useState<ApplicationDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve')

  useEffect(() => {
    loadApplicationDetail()
  }, [id])

  async function loadApplicationDetail() {
    try {
      setIsLoading(true)
      const response = await axios.get<ApplicationDetail>(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/applications/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      )
      setData(response.data)
    } catch (error) {
      console.error('Failed to load application detail:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleReview(action: 'approve' | 'reject') {
    if (isSubmitting) return

    if (action === 'reject' && !reviewNotes.trim()) {
      alert('거절 사유를 입력해주세요.')
      return
    }

    try {
      setIsSubmitting(true)

      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/applications/${id}/${action}`,
        { reviewNotes: reviewNotes.trim() || undefined },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      )

      alert(action === 'approve' ? '승인되었습니다.' : '거절되었습니다.')
      router.push('/admin/applications')
    } catch (error: any) {
      console.error('Failed to review application:', error)
      alert(error.response?.data?.error?.message || '처리 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
      setShowReviewDialog(false)
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
      <div className="text-center">
        <p className="text-gray-500">지원 정보를 찾을 수 없습니다.</p>
        <button
          onClick={() => router.push('/admin/applications')}
          className="mt-4 text-blue-600 hover:underline"
        >
          목록으로 돌아가기
        </button>
      </div>
    )
  }

  const { application, user } = data

  return (
    <div className="max-w-5xl">
      {/* 헤더 */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/admin/applications')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          목록으로
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{application.name}</h1>
            <p className="text-gray-500 mt-1">{application.displayId}</p>
          </div>
          <StatusBadge status={application.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 메인 정보 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 기본 정보 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>
            <div className="space-y-3">
              <InfoRow icon={<Mail className="w-5 h-5" />} label="이메일" value={application.email} />
              <InfoRow icon={<Briefcase className="w-5 h-5" />} label="직함" value={application.jobTitle || '-'} />
              <InfoRow icon={<FileText className="w-5 h-5" />} label="전문분야" value={application.specialty} />
              <InfoRow icon={<Clock className="w-5 h-5" />} label="경력" value={`${application.experienceYears}년`} />
              <InfoRow icon={<Calendar className="w-5 h-5" />} label="신청일" value={new Date(application.createdAt).toLocaleDateString('ko-KR')} />
            </div>
          </div>

          {/* 자기소개 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">자기소개</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{application.bio}</p>
          </div>

          {/* 키워드 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">키워드</h2>
            <div className="flex flex-wrap gap-2">
              {application.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          {/* 상담 유형 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">상담 유형</h2>
            <div className="flex flex-wrap gap-2">
              {application.consultationTypes.map((type, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>

          {/* 프로필 이미지 */}
          {application.profileImage && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">프로필 사진</h2>
              <img
                src={application.profileImage}
                alt="프로필"
                className="w-40 h-40 rounded-lg object-cover"
              />
            </div>
          )}
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 검수 액션 */}
          {application.status === 'PENDING' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">검수</h2>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setReviewAction('approve')
                    setShowReviewDialog(true)
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  <CheckCircle className="w-5 h-5" />
                  승인
                </button>
                <button
                  onClick={() => {
                    setReviewAction('reject')
                    setShowReviewDialog(true)
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  <XCircle className="w-5 h-5" />
                  거절
                </button>
              </div>
            </div>
          )}

          {/* 검수 결과 */}
          {application.status !== 'PENDING' && application.reviewedAt && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">검수 결과</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">검수일</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(application.reviewedAt).toLocaleString('ko-KR')}
                  </p>
                </div>
                {application.reviewNotes && (
                  <div>
                    <p className="text-sm text-gray-600">메모</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{application.reviewNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 사용자 정보 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">사용자 정보</h2>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-600">User ID</p>
                <p className="font-medium text-gray-900">{user.id}</p>
              </div>
              <div>
                <p className="text-gray-600">가입일</p>
                <p className="font-medium text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                </p>
              </div>
              {user.phoneNumber && (
                <div>
                  <p className="text-gray-600">전화번호</p>
                  <p className="font-medium text-gray-900">{user.phoneNumber}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 검수 다이얼로그 */}
      {showReviewDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {reviewAction === 'approve' ? '지원 승인' : '지원 거절'}
            </h3>
            <p className="text-gray-600 mb-4">
              {reviewAction === 'approve'
                ? '이 지원을 승인하시겠습니까?'
                : '거절 사유를 입력해주세요.'}
            </p>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder={reviewAction === 'approve' ? '메모 (선택사항)' : '거절 사유 (필수)'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowReviewDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={isSubmitting}
              >
                취소
              </button>
              <button
                onClick={() => handleReview(reviewAction)}
                className={`flex-1 px-4 py-2 rounded-lg text-white font-medium ${
                  reviewAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? '처리 중...' : reviewAction === 'approve' ? '승인' : '거절'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-gray-400">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  )
}
