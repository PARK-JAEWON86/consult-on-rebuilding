'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'

export default function KakaoCallbackPage() {
  const router = useRouter()
  const { refreshUser } = useAuth()

  useEffect(() => {
    // Kakao 로그인 콜백 후 인증 상태 확인
    const handleCallback = async () => {
      try {
        // 잠시 대기 후 인증 상태 확인
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 인증 상태 재확인
        await refreshUser()

        // 홈으로 리다이렉트
        router.push('/')
      } catch (error) {
        console.error('Kakao login callback error:', error)
        router.push('/auth/login?error=kakao-login-failed')
      }
    }

    handleCallback()
  }, [router, refreshUser])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
        <p className="text-gray-600">카카오 로그인 처리 중...</p>
      </div>
    </div>
  )
}
