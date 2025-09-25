import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import axios from 'axios'

export interface User {
  id: string;
  email: string;
  name?: string;
  roles: ('USER' | 'EXPERT' | 'ADMIN')[];
  createdAt: string;
  updatedAt: string;
  credits?: number;
  avatarUrl?: string;
  isEmailVerified?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1'

// 서버 사이드에서만 사용하는 함수들
export async function getCurrentUser(): Promise<User | null> {
  // 서버사이드에서는 쿠키 헤더 문제로 인해 null을 반환
  // 클라이언트사이드 AuthProvider에서 인증 처리
  return null
}

// 인증이 필요한 페이지에서 사용 (인증되지 않은 경우 로그인 페이지로 리다이렉트)
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  return user
}

// 특정 역할이 필요한 경우 체크
export async function requireRole(allowedRoles: string[]): Promise<User> {
  const user = await requireAuth()
  
  const hasRole = user.roles.some(role => allowedRoles.includes(role))
  
  if (!hasRole) {
    redirect('/dashboard')
  }
  
  return user
}

// Expert 역할만 허용
export async function requireExpert(): Promise<User> {
  return requireRole(['EXPERT', 'ADMIN'])
}

// Admin 역할만 허용
export async function requireAdmin(): Promise<User> {
  return requireRole(['ADMIN'])
}

// 서버 사이드에서 초기 인증 상태 생성
export async function getInitialAuthState(): Promise<{ user: User | null }> {
  const user = await getCurrentUser()
  
  return {
    user
  }
}
