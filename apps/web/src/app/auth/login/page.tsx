'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import Card from '@/components/ui/Card'
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  const [message, setMessage] = useState('')
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // 이미 로그인된 경우 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  // URL에서 메시지 확인
  useEffect(() => {
    const urlMessage = searchParams.get('message')
    if (urlMessage === 'registration-success') {
      setMessage('회원가입이 완료되었습니다. 로그인해주세요.')
    }
  }, [searchParams])

  if (isAuthenticated) {
    return null // Will redirect
  }

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">로그인</h1>
        <p className="text-gray-600">Consult On에 오신 것을 환영합니다</p>
      </div>

      <Card>
        {/* 성공 메시지 */}
        {message && (
          <div className="bg-green-50 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="font-medium text-green-900 mb-1">성공</h3>
                <p className="text-sm text-green-800">{message}</p>
              </div>
            </div>
          </div>
        )}

        <LoginForm />
      </Card>

      <div className="mt-8 text-center">
        <Link href="/" className="text-gray-600 hover:text-gray-900 text-sm">
          ← 홈으로 돌아가기
        </Link>
      </div>
      
      {/* 개발용 테스트 정보 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6">
          <Card>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-medium text-blue-900 mb-1">개발용 테스트 계정</h3>
                  <p className="text-sm text-blue-800 mb-2">
                    이메일: user1@test.com<br/>
                    비밀번호: password123
                  </p>
                  <p className="text-xs text-blue-700">
                    API 서버(포트 4000)가 실행 중인지 확인하세요.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </main>
  )
}
