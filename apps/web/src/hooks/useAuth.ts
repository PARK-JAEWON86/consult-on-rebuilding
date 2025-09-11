'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useMe } from './useMe'

export interface LoginCredentials {
  email: string
  password: string
}

export const useAuth = () => {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { data: user, isLoading, error, isError } = useMe()

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await api.post('/auth/login', credentials)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      router.push('/')
    },
    onError: (error: any) => {
      console.error('Login failed:', error.message)
    }
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout')
    },
    onSuccess: () => {
      queryClient.setQueryData(['me'], null)
      queryClient.invalidateQueries({ queryKey: ['me'] })
      router.push('/auth/login')
    },
    onError: (error: any) => {
      console.error('Logout failed:', error.message)
      // Even if logout fails, clear local state
      queryClient.setQueryData(['me'], null)
      router.push('/auth/login')
    }
  })

  return {
    user,
    isLoading,
    isError,
    error,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoginLoading: loginMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,
    loginError: loginMutation.error,
    logoutError: logoutMutation.error,
  }
}
