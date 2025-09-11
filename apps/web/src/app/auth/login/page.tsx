'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  
  const { login, isLoginLoading, loginError, isAuthenticated } = useAuth()
  const router = useRouter()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.email || !formData.password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }

    try {
      await login({ email: formData.email, password: formData.password })
    } catch (err: any) {
      setError(err.message || '로그인에 실패했습니다.')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

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
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              이메일
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={isLoginLoading}
            />
          </div>

          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="비밀번호를 입력하세요"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={isLoginLoading}
            />
          </div>

          {(error || loginError) && (
            <div className="bg-red-50 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-medium text-red-900 mb-1">로그인 실패</h3>
                  <p className="text-sm text-red-800">
                    {error || loginError?.message || '로그인에 실패했습니다.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full"
            loading={isLoginLoading}
            disabled={isLoginLoading}
          >
            {isLoginLoading ? '로그인 중...' : '로그인'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            계정이 없으신가요?{' '}
            <Link href="/auth/register" className="text-blue-600 hover:text-blue-500 font-medium">
              회원가입
            </Link>
          </p>
        </div>
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
                    백엔드 서버(포트 3001)가 실행 중인지 확인하세요.
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
