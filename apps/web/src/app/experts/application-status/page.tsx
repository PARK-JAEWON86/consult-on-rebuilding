'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { CheckCircle2, Clock, Mail, Home, FileText, Bell } from 'lucide-react'
import ApplicationTimeline from '@/components/experts/ApplicationTimeline'
import ApplicationSummaryCard from '@/components/experts/ApplicationSummaryCard'

export default function ApplicationStatusPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [applicationData, setApplicationData] = useState<any>(null)
  const [emailNotification, setEmailNotification] = useState(true)
  const [smsNotification, setSmsNotification] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      const status = (user as any).expertApplicationStatus

      // 상태가 PENDING이 아니면 리다이렉트
      if (status !== 'PENDING') {
        if (status === 'APPROVED' || user.expert) {
          router.push('/dashboard/expert')
        } else {
          router.push('/experts/become')
        }
      }
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4 animate-pulse">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            전문가 등록 신청이 접수되었습니다
          </h1>
          <p className="text-gray-600">
            제출하신 전문가 등록 신청을 검토하고 있습니다
          </p>
        </div>

        {/* 진행 상황 타임라인 */}
        <div className="mb-6">
          <ApplicationTimeline
            currentStage={(user as any)?.expertApplicationData?.currentStage || 'SUBMITTED'}
            submittedAt={new Date((user as any)?.expertApplicationData?.submittedAt || Date.now())}
          />
        </div>

        {/* 신청 정보 및 알림 설정 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* 신청 정보 요약 (좌측, 2/3 너비) */}
          <div className="lg:col-span-2">
            <ApplicationSummaryCard
              applicationData={{
                id: (user as any)?.expertApplicationData?.id || 0,
                categoryName: (user as any)?.expertApplicationData?.category || '전문 분야',
                specialty: (user as any)?.expertApplicationData?.specialty || '세부 전문',
                submittedAt: new Date((user as any)?.expertApplicationData?.submittedAt || Date.now()),
                bio: (user as any)?.expertApplicationData?.bio,
                keywords: (user as any)?.expertApplicationData?.keywords,
                consultationTypes: (user as any)?.expertApplicationData?.consultationTypes,
              }}
            />
          </div>

          {/* 알림 설정 카드 (우측, 1/3 너비) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-gray-700" />
                <h3 className="font-semibold text-gray-900">알림 설정</h3>
              </div>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700">이메일 알림</span>
                  <input
                    type="checkbox"
                    checked={emailNotification}
                    onChange={(e) => setEmailNotification(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700">SMS 알림</span>
                  <input
                    type="checkbox"
                    checked={smsNotification}
                    onChange={(e) => setSmsNotification(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                검수 상태가 변경되면 선택하신 방법으로 알려드립니다
              </p>
            </div>
          </div>
        </div>

        {/* 상태 정보 카드 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 검수 기간 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">예상 검수 기간</h3>
                <p className="text-gray-600 text-sm">
                  평균 1~3 영업일 소요
                </p>
              </div>
            </div>

            {/* 결과 통보 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">결과 안내</h3>
                <p className="text-gray-600 text-sm">
                  이메일로 결과 전송
                </p>
              </div>
            </div>

            {/* 추가 서류 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">추가 서류 요청</h3>
                <p className="text-gray-600 text-sm">
                  필요 시 요청 가능
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 안내 사항 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">안내 사항</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>검수 과정에서 제출하신 정보의 정확성을 확인합니다</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>영업일 기준으로 처리되며, 주말 및 공휴일은 제외됩니다</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>승인 완료 시 바로 전문가 활동을 시작하실 수 있습니다</span>
            </li>
          </ul>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push('/')}
            className="flex-1 inline-flex items-center justify-center px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            홈으로 돌아가기
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors"
          >
            대시보드로 이동
          </button>
        </div>

        {/* 문의 안내 */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            문의사항이 있으신가요?{' '}
            <a href="mailto:consult.on.official@gmail.com" className="text-blue-600 hover:underline">
              consult.on.official@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
