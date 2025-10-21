'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { CheckCircle2, Clock, Mail, Home, FileText, Bell } from 'lucide-react'
import ApplicationTimeline from '@/components/experts/ApplicationTimeline'
import ApplicationSummaryCard from '@/components/experts/ApplicationSummaryCard'
import { api } from '@/lib/api'

export default function ApplicationStatusPage() {
  const router = useRouter()
  const { user, isLoading, refreshUser } = useAuth()
  const [emailNotification, setEmailNotification] = useState(true)
  const [smsNotification, setSmsNotification] = useState(false)
  const [isSavingNotification, setIsSavingNotification] = useState(false)
  const [isInitialRefreshComplete, setIsInitialRefreshComplete] = useState(false)

  // 페이지 마운트 시 사용자 정보 갱신 (최신 expertApplicationData 가져오기)
  useEffect(() => {
    const initializePage = async () => {
      // 이미 초기화 완료되었으면 skip
      if (isInitialRefreshComplete) {
        return
      }

      if (!isLoading) {
        if (user) {
          console.log('📋 [Application Status] 초기 로딩 - 사용자 정보 갱신 시작...')
          try {
            await refreshUser()
            console.log('✅ [Application Status] 사용자 정보 갱신 완료')
          } catch (error) {
            console.error('❌ [Application Status] 사용자 정보 갱신 실패:', error)
            // 갱신 실패해도 페이지는 보여줌
          }
        }
        // 사용자가 있든 없든 갱신 완료 플래그 설정
        setIsInitialRefreshComplete(true)
      }
    }

    initializePage()
  }, [isLoading, isInitialRefreshComplete]) // 의존성 배열 수정

  // 사용자 정보 로드 시 알림 설정 초기화
  useEffect(() => {
    if (user && (user as any).expertApplicationData) {
      const appData = (user as any).expertApplicationData
      console.log('📋 진행상황 페이지 - 전문가 신청 데이터:', appData)
      setEmailNotification(appData.emailNotification ?? true)
      setSmsNotification(appData.smsNotification ?? false)
    }
  }, [user])

  // ✅ 수정: 초기 갱신이 완료된 후에만 리다이렉트 로직 실행
  useEffect(() => {
    // 초기 갱신이 완료되지 않았으면 대기
    if (!isInitialRefreshComplete) {
      console.log('⏳ [Application Status] 초기 갱신 대기 중...')
      return
    }

    console.log('🔍 [Application Status] 리다이렉트 검사 시작', {
      isLoading,
      hasUser: !!user,
      status: (user as any)?.expertApplicationStatus,
    })

    if (!isLoading && !user) {
      console.log('❌ [Application Status] 사용자 없음 → 로그인 페이지로 이동')
      router.push('/auth/login')
      return
    }

    if (user) {
      const status = (user as any).expertApplicationStatus

      // PENDING과 ADDITIONAL_INFO_REQUESTED면 페이지 유지
      if (status === 'PENDING' || status === 'ADDITIONAL_INFO_REQUESTED') {
        console.log('✅ [Application Status] 정상 상태 - 페이지 유지', { status })
        return
      }

      // APPROVED 상태면 전문가 대시보드로
      if (status === 'APPROVED' || user.expert) {
        console.log('✅ [Application Status] 승인됨 → 전문가 대시보드로 이동')
        router.push('/dashboard/expert')
        return
      }

      // REJECTED 상태면 신청 페이지로 (재지원 가능)
      if (status === 'REJECTED') {
        console.log('⚠️ [Application Status] 거절됨 → 신청 페이지로 이동')
        router.push('/experts/become')
        return
      }

      // status가 null/undefined인 경우는 아직 신청하지 않은 것이므로 신청 페이지로
      // 단, 페이지에 막 진입한 직후 (become에서 온 경우)는 제외
      // 이를 위해 추가 안전장치: expertApplicationData가 있으면 페이지 유지
      if (!status && !(user as any)?.expertApplicationData) {
        console.log('⚠️ [Application Status] 신청 상태 없음 → 신청 페이지로 이동')
        router.push('/experts/become')
      } else if (!status && (user as any)?.expertApplicationData) {
        console.log('✅ [Application Status] 신청 데이터 존재 - 페이지 유지 (상태 갱신 대기 중)')
      }
    }
  }, [user, isLoading, router, isInitialRefreshComplete])

  // 알림 설정 업데이트 함수
  const handleNotificationChange = async (type: 'email' | 'sms', value: boolean) => {
    try {
      setIsSavingNotification(true)

      const newSettings = {
        emailNotification: type === 'email' ? value : emailNotification,
        smsNotification: type === 'sms' ? value : smsNotification
      }

      const response = await api.put('/experts/application/notification-settings', newSettings)

      if (response.data.success) {
        // 성공 시 상태 업데이트
        if (type === 'email') {
          setEmailNotification(value)
        } else {
          setSmsNotification(value)
        }
      }
    } catch (error) {
      console.error('알림 설정 업데이트 실패:', error)
      alert('알림 설정 업데이트에 실패했습니다. 다시 시도해주세요.')

      // 실패 시 이전 값으로 복구
      if (type === 'email') {
        setEmailNotification(!value)
      } else {
        setSmsNotification(!value)
      }
    } finally {
      setIsSavingNotification(false)
    }
  }

  // 초기 갱신이 완료되지 않았거나 로딩 중이면 로딩 화면 표시
  if (!isInitialRefreshComplete || isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {!isInitialRefreshComplete ? '사용자 정보를 확인하는 중...' : '로딩 중...'}
          </p>
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

        {/* 진행 상황 타임라인 + 우측 사이드바 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* 진행 상황 타임라인 (좌측, 2/3 너비) */}
          <div className="lg:col-span-2">
            <ApplicationTimeline
              currentStage={(user as any)?.expertApplicationData?.currentStage || 'SUBMITTED'}
              submittedAt={new Date((user as any)?.expertApplicationData?.submittedAt || Date.now())}
            />
          </div>

          {/* 우측 사이드바: 알림 설정 + 예상 검수 기간 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 알림 설정 카드 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
                    onChange={(e) => handleNotificationChange('email', e.target.checked)}
                    disabled={isSavingNotification}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </label>
                <label className="flex items-center justify-between cursor-not-allowed opacity-50">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-700">SMS 알림</span>
                    <span className="text-xs text-gray-500">(기능구현 준비중)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={smsNotification}
                    onChange={(e) => setSmsNotification(e.target.checked)}
                    disabled
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                검수 상태가 변경되면 선택하신 방법으로 알려드립니다
              </p>
            </div>

            {/* 예상 검수 기간 카드 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="space-y-4">
                {/* 검수 기간 */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm mb-0.5">예상 검수 기간</h3>
                    <p className="text-gray-600 text-xs">
                      평균 1~3 영업일 소요
                    </p>
                  </div>
                </div>

                {/* 결과 통보 */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-9 h-9 bg-green-50 rounded-full flex items-center justify-center">
                    <Mail className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm mb-0.5">결과 안내</h3>
                    <p className="text-gray-600 text-xs">
                      이메일로 결과 전송
                    </p>
                  </div>
                </div>

                {/* 추가 서류 */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-9 h-9 bg-purple-50 rounded-full flex items-center justify-center">
                    <FileText className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm mb-0.5">추가 서류 요청</h3>
                    <p className="text-gray-600 text-xs">
                      필요 시 요청 가능
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 신청 정보 요약 (전체 너비) */}
        <div className="mb-6">
          <ApplicationSummaryCard
            applicationData={{
              id: (user as any)?.expertApplicationData?.id || 0,
              displayId: (user as any)?.expertApplicationData?.displayId,
              categoryName: (user as any)?.expertApplicationData?.category || '전문 분야',
              specialty: (user as any)?.expertApplicationData?.specialty || '세부 전문',
              submittedAt: new Date((user as any)?.expertApplicationData?.submittedAt || Date.now()),
              name: (user as any)?.expertApplicationData?.name,
              email: (user as any)?.expertApplicationData?.email,
              phoneNumber: (user as any)?.expertApplicationData?.phoneNumber,
              experienceYears: (user as any)?.expertApplicationData?.experienceYears,
              languages: (user as any)?.expertApplicationData?.languages,
              bio: (user as any)?.expertApplicationData?.bio,
              keywords: (user as any)?.expertApplicationData?.keywords,
              consultationTypes: (user as any)?.expertApplicationData?.consultationTypes,
              certifications: (() => {
                const certData = (user as any)?.expertApplicationData?.certifications;
                console.log('🔍 자격증 데이터:', certData);
                console.log('🔍 자격증 타입:', typeof certData);
                console.log('🔍 자격증 배열 여부:', Array.isArray(certData));
                if (certData && certData.length > 0) {
                  console.log('🔍 첫번째 자격증:', certData[0]);
                }
                return certData;
              })(),
              education: (user as any)?.expertApplicationData?.education,
              workExperience: (user as any)?.expertApplicationData?.workExperience,
              profileImage: (user as any)?.expertApplicationData?.profileImage,
              mbti: (user as any)?.expertApplicationData?.mbti,
              consultationStyle: (user as any)?.expertApplicationData?.consultationStyle,
              availability: (user as any)?.expertApplicationData?.availability,
              socialLinks: (() => {
                const socialData = (user as any)?.expertApplicationData?.socialLinks;
                console.log('🔍 소셜링크 데이터:', socialData);
                console.log('🔍 소셜링크 타입:', typeof socialData);
                console.log('🔍 소셜링크 객체 여부:', socialData && typeof socialData === 'object');
                return socialData;
              })(),
              portfolioImages: (() => {
                const portfolioData = (user as any)?.expertApplicationData?.portfolioImages;
                console.log('🔍 포트폴리오 이미지 데이터:', portfolioData);
                console.log('🔍 포트폴리오 타입:', typeof portfolioData);
                console.log('🔍 포트폴리오 배열 여부:', Array.isArray(portfolioData));
                if (portfolioData && portfolioData.length > 0) {
                  console.log('🔍 첫번째 포트폴리오:', portfolioData[0]);
                }
                return portfolioData;
              })(),
            }}
          />
        </div>

        {/* 안내 사항 (전체 너비) */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2 text-sm">안내 사항</h3>
          <ul className="space-y-2 text-xs text-blue-800">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>검수 과정에서 제출하신 정보의 정확성을 확인합니다</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>영업일 기준으로 처리되며, 주말 및 공휴일은 제외됩니다</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
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
