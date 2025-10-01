'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { User, AuthState } from '@/lib/auth'
import { EmailVerificationStorage } from '@/lib/email-verification'

interface AuthContextType extends AuthState {
  isAuthenticated: boolean
  refreshUser: () => Promise<void>
  logout: () => Promise<void>
  login: (credentials: { email: string; password: string }) => Promise<void>
  register: (credentials: { 
    email: string; 
    password: string; 
    name: string; 
    verificationCode: string 
  }) => Promise<void>
  sendVerificationEmail: (email: string) => Promise<void>
  googleLogin: () => void
  isLoginLoading: boolean
  isRegisterLoading: boolean
  isLogoutLoading: boolean
  isVerificationLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

interface AuthProviderProps {
  children: ReactNode
  initialUser: User | null
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser)
  // 초기 로딩 상태를 true로 설정하여 인증 확인 중임을 표시
  const [isLoading, setIsLoading] = useState(!initialUser)
  const [isLoginLoading, setIsLoginLoading] = useState(false)
  const [isRegisterLoading, setIsRegisterLoading] = useState(false)
  const [isLogoutLoading, setIsLogoutLoading] = useState(false)
  const [isVerificationLoading, setIsVerificationLoading] = useState(false)
  const router = useRouter()

  // 사용자 정보 새로고침
  const refreshUser = async () => {
    console.log('🔄 AuthProvider: Starting refreshUser')
    setIsLoading(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1'
      console.log('🌐 AuthProvider: API URL:', apiUrl)
      console.log('🌐 AuthProvider: Making API call to /auth/me')
      const response = await api.get('/auth/me')
      console.log('📥 Auth API response:', response)

      if (response.success && response.data && response.data.user) {
        console.log('✅ User data found:', response.data.user)
        setUser(response.data.user)
      } else {
        console.log('❌ No user data in response, setting user to null')
        setUser(null)
      }
    } catch (error) {
      console.error('🚨 Failed to refresh user:', error)
      console.error('Error details:', {
        message: error.message,
        status: (error as any).status,
        stack: error.stack
      })
      setUser(null)
    } finally {
      setIsLoading(false)
      console.log('🏁 AuthProvider: refreshUser completed')
    }
  }

  // 로그인
  const login = async (credentials: { email: string; password: string }) => {
    setIsLoginLoading(true)
    try {
      const response = await api.post('/auth/login', credentials)
      if (response.success) {
        // 로그인 성공 후 사용자 정보 새로고침
        await refreshUser()

        // 사용자 정보 가져오기
        const meResponse = await api.get('/auth/me')
        const loggedInUser = meResponse.success ? meResponse.data?.user : null

        // redirect 파라미터가 있으면 해당 페이지로
        const urlParams = new URLSearchParams(window.location.search)
        const redirectPath = urlParams.get('redirect')

        if (redirectPath) {
          router.push(decodeURIComponent(redirectPath) as any)
        } else {
          // 관리자 계정이면 관리자 대시보드로, 아니면 일반 대시보드로
          const roles = Array.isArray(loggedInUser?.roles)
            ? loggedInUser.roles
            : typeof loggedInUser?.roles === 'string'
              ? JSON.parse(loggedInUser.roles)
              : []

          if (roles.includes('ADMIN')) {
            router.push('/admin')
          } else {
            router.push('/dashboard')
          }
        }
      }
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      setIsLoginLoading(false)
    }
  }

  // 회원가입
  const register = async (credentials: { 
    email: string; 
    password: string; 
    name: string; 
    verificationCode: string 
  }) => {
    setIsRegisterLoading(true)
    try {
      const response = await api.post('/auth/register', credentials)
      if (response.success) {
        EmailVerificationStorage.clearVerificationData()
        router.push('/auth/login?message=registration-success')
      }
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    } finally {
      setIsRegisterLoading(false)
    }
  }

  // 이메일 인증 요청
  const sendVerificationEmail = async (email: string) => {
    setIsVerificationLoading(true)
    try {
      const response = await api.post('/auth/resend-verification', { email })
      if (response.success) {
        // 인증 코드를 로컬 스토리지에 저장 (5분 유효)
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
        EmailVerificationStorage.saveVerificationData({
          email: response.data.email,
          code: response.data.verificationCode,
          expiresAt
        })
      }
    } catch (error) {
      console.error('Email verification failed:', error)
      throw error
    } finally {
      setIsVerificationLoading(false)
    }
  }

  // Google 로그인
  const googleLogin = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1'
    window.location.href = `${apiUrl}/auth/google`
  }

  // 로그아웃
  const logout = async () => {
    setIsLogoutLoading(true)
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setUser(null)
      setIsLogoutLoading(false)
      router.push('/auth/login')
    }
  }

  // 페이지 로드 시 인증 상태 확인 및 Google 로그인 후 리다이렉트 처리
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)

    if (urlParams.get('auth') === 'success') {
      // Google 로그인 성공 후 상태 확인
      setTimeout(() => {
        refreshUser()
        // URL에서 auth 파라미터 제거
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete('auth')
        window.history.replaceState({}, '', newUrl.toString())
      }, 500)
    } else if (!initialUser) {
      // initialUser가 없으면 (서버에서 인증 정보를 받지 못한 경우) 클라이언트에서 확인
      refreshUser()
    }
  }, [])

  // 인증 상태 계산
  const isAuthenticated = !!user && !isLoading

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    refreshUser,
    logout,
    login,
    register,
    sendVerificationEmail,
    googleLogin,
    isLoginLoading,
    isRegisterLoading,
    isLogoutLoading,
    isVerificationLoading,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
