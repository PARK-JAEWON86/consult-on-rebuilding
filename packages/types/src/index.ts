// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
}

// User Types
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  createdAt: string
  updatedAt: string
}

export enum UserRole {
  USER = 'USER',
  EXPERT = 'EXPERT',
  ADMIN = 'ADMIN',
}

// Auth Types
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  accessToken: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

// Health Check Types
export interface HealthCheck {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  checks: {
    server: string
    database: string
    redis: string
  }
}

// Common Types
export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Error Codes
export const ERROR_CODES = {
  // Auth errors
  E_AUTH_INVALID_CREDENTIALS: 'E_AUTH_INVALID_CREDENTIALS',
  E_AUTH_TOKEN_EXPIRED: 'E_AUTH_TOKEN_EXPIRED',
  E_AUTH_UNAUTHORIZED: 'E_AUTH_UNAUTHORIZED',
  E_AUTH_FORBIDDEN: 'E_AUTH_FORBIDDEN',
  
  // Validation errors
  E_VALIDATION_FAILED: 'E_VALIDATION_FAILED',
  
  // Resource errors
  E_RESOURCE_NOT_FOUND: 'E_RESOURCE_NOT_FOUND',
  E_RESOURCE_CONFLICT: 'E_RESOURCE_CONFLICT',
  
  // Rate limiting
  E_RATE_LIMIT_EXCEEDED: 'E_RATE_LIMIT_EXCEEDED',
  
  // Server errors
  E_INTERNAL_ERROR: 'E_INTERNAL_ERROR',
  E_SERVICE_UNAVAILABLE: 'E_SERVICE_UNAVAILABLE',
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]
