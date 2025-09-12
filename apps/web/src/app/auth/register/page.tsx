'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { EmailVerificationStorage } from '@/lib/email-verification'

export default function RegisterPage() {
  const [step, setStep] = useState<'email' | 'verification' | 'password'>('email')
  const [formData, setFormData] = useState({
    email: '',
    verificationCode: '',
    password: '',
    confirmPassword: '',
    name: '',
  })
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  
  const { 
    sendVerificationEmail, 
    register, 
    isVerificationLoading, 
    isRegisterLoading,
    verificationError,
    registerError 
  } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // URL에서 메시지 확인
  useEffect(() => {
    const message = searchParams.get('message')
    if (message === 'verification-sent') {
      setStep('verification')
    }
  }, [searchParams])

  // 카운트다운 타이머
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    setError('')
  }

  const handleSendVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.email) {
      setError('이메일을 입력해주세요.')
      return
    }

    try {
      await sendVerificationEmail({ email: formData.email })
      setStep('verification')
      setCountdown(300) // 5분
    } catch (err: any) {
      setError(err.message || '인증 이메일 전송에 실패했습니다.')
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.verificationCode) {
      setError('인증 코드를 입력해주세요.')
      return
    }

    if (!EmailVerificationStorage.isCodeValid(formData.verificationCode)) {
      setError('인증 코드가 올바르지 않거나 만료되었습니다.')
      return
    }

    setStep('password')
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.password || !formData.confirmPassword || !formData.name) {
      setError('모든 필드를 입력해주세요.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    if (formData.password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.')
      return
    }

    try {
      await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        verificationCode: formData.verificationCode
      })
    } catch (err: any) {
      setError(err.message || '회원가입에 실패했습니다.')
    }
  }

  const handleResendCode = async () => {
    try {
      await sendVerificationEmail({ email: formData.email })
      setCountdown(300)
      setError('')
    } catch (err: any) {
      setError(err.message || '인증 이메일 재전송에 실패했습니다.')
    }
  }

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">회원가입</h1>
        <p className="text-gray-600">Consult On에 오신 것을 환영합니다</p>
      </div>

      <Card>
        {/* 이메일 입력 단계 */}
        {step === 'email' && (
          <form onSubmit={handleSendVerification} className="space-y-6">
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                이메일 주소
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
                disabled={isVerificationLoading}
              />
            </div>

            {(error || verificationError) && (
              <div className="bg-red-50 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="font-medium text-red-900 mb-1">오류</h3>
                    <p className="text-sm text-red-800">
                      {error || verificationError?.message || '인증 이메일 전송에 실패했습니다.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full"
              loading={isVerificationLoading}
              disabled={isVerificationLoading}
            >
              {isVerificationLoading ? '인증 이메일 전송 중...' : '인증 이메일 전송'}
            </Button>
          </form>
        )}

        {/* 이메일 인증 단계 */}
        {step === 'verification' && (
          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600">
                <strong>{formData.email}</strong>로 인증 코드를 전송했습니다.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                이메일을 확인하고 6자리 인증 코드를 입력해주세요.
              </p>
            </div>

            <div>
              <label 
                htmlFor="verificationCode" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                인증 코드
              </label>
              <input
                type="text"
                id="verificationCode"
                name="verificationCode"
                value={formData.verificationCode}
                onChange={handleInputChange}
                placeholder="123456"
                maxLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest"
                required
              />
            </div>

            {countdown > 0 && (
              <p className="text-sm text-gray-500 text-center">
                {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')} 후 재전송 가능
              </p>
            )}

            {(error || verificationError) && (
              <div className="bg-red-50 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="font-medium text-red-900 mb-1">오류</h3>
                    <p className="text-sm text-red-800">
                      {error || verificationError?.message || '인증에 실패했습니다.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button 
                type="submit" 
                className="w-full"
              >
                인증 확인
              </Button>
              
              <Button 
                type="button" 
                variant="outline"
                className="w-full"
                onClick={handleResendCode}
                disabled={countdown > 0}
              >
                {countdown > 0 ? `재전송 (${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')})` : '인증 코드 재전송'}
              </Button>
            </div>
          </form>
        )}

        {/* 비밀번호 설정 단계 */}
        {step === 'password' && (
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">
                이메일 인증이 완료되었습니다.
              </p>
            </div>

            <div>
              <label 
                htmlFor="name" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                이름
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="홍길동"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isRegisterLoading}
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
                placeholder="8자 이상 입력해주세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isRegisterLoading}
              />
            </div>

            <div>
              <label 
                htmlFor="confirmPassword" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                비밀번호 확인
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="비밀번호를 다시 입력해주세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isRegisterLoading}
              />
            </div>

            {(error || registerError) && (
              <div className="bg-red-50 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="font-medium text-red-900 mb-1">오류</h3>
                    <p className="text-sm text-red-800">
                      {error || registerError?.message || '회원가입에 실패했습니다.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full"
              loading={isRegisterLoading}
              disabled={isRegisterLoading}
            >
              {isRegisterLoading ? '회원가입 중...' : '회원가입 완료'}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            이미 계정이 있으신가요?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-500 font-medium">
              로그인
            </Link>
          </p>
        </div>
      </Card>

      <div className="mt-8 text-center">
        <Link href="/" className="text-gray-600 hover:text-gray-900 text-sm">
          ← 홈으로 돌아가기
        </Link>
      </div>
    </main>
  )
}
