'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, AlertCircle } from 'lucide-react'

interface UserData {
  userId: number
  email: string
  name: string
  provider: string
  isNewUser: boolean
}

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get('token')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('토큰이 제공되지 않았습니다.')
      setLoading(false)
      return
    }

    // 토큰 검증
    const verifyToken = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/verify-temp-token?token=${token}`,
          { credentials: 'include' }
        )

        const data = await response.json()

        if (!data.success) {
          setError(data.error?.message || '유효하지 않은 토큰입니다.')
          setLoading(false)
          return
        }

        setUserData(data.data.user)
        setLoading(false)
      } catch (error) {
        console.error('Token verification error:', error)
        setError('토큰 검증 중 오류가 발생했습니다.')
        setLoading(false)
      }
    }

    verifyToken()
  }, [token])

  const handleComplete = async () => {
    if (!agreedToTerms) {
      alert('약관에 동의해주세요.')
      return
    }

    if (!token) {
      alert('토큰이 유효하지 않습니다.')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/complete-onboarding`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            tempToken: token,
            agreedToTerms: true,
          }),
        }
      )

      const data = await response.json()

      if (!data.success) {
        alert(data.error?.message || '온보딩 완료 중 오류가 발생했습니다.')
        setSubmitting(false)
        return
      }

      // 온보딩 완료 - 홈으로 리다이렉트 (onboarding=complete 파라미터 추가하여 auth 상태 갱신 트리거)
      router.push('/?onboarding=complete')
    } catch (error) {
      console.error('Onboarding completion error:', error)
      alert('온보딩 완료 중 오류가 발생했습니다.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">토큰을 확인하는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">
            오류가 발생했습니다
          </h2>
          <p className="text-center text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
          >
            로그인 페이지로 이동
          </button>
        </div>
      </div>
    )
  }

  const providerName = userData?.provider === 'google' ? 'Google' : '카카오'
  const providerColor = userData?.provider === 'google' ? 'bg-blue-600' : 'bg-yellow-400'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 ${providerColor} rounded-full mb-4`}>
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              환영합니다!
            </h2>
            <p className="text-gray-600">
              {providerName}으로 로그인하셨습니다
            </p>
          </div>

          {/* 사용자 정보 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">이름</span>
                <span className="text-sm font-medium text-gray-900">{userData?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">이메일</span>
                <span className="text-sm font-medium text-gray-900">{userData?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">로그인 방법</span>
                <span className="text-sm font-medium text-gray-900">{providerName}</span>
              </div>
            </div>
          </div>

          {/* 약관 동의 */}
          <div className="mb-6">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                <a href="/terms" target="_blank" className="text-blue-600 hover:underline">
                  이용약관
                </a>
                {' '}및{' '}
                <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">
                  개인정보처리방침
                </a>
                에 동의합니다 (필수)
              </span>
            </label>
          </div>

          {/* 완료 버튼 */}
          <button
            onClick={handleComplete}
            disabled={!agreedToTerms || submitting}
            className={`w-full py-3 px-4 rounded-md font-medium transition ${
              agreedToTerms && !submitting
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {submitting ? '처리 중...' : '시작하기'}
          </button>

          {/* 추가 안내 */}
          <p className="mt-4 text-xs text-center text-gray-500">
            {userData?.isNewUser
              ? '새로운 계정이 생성됩니다.'
              : '기존 계정에 연동됩니다.'}
          </p>
        </div>
      </div>
    </div>
  )
}
