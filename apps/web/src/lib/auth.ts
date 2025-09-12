// 클라이언트 사이드에서 사용할 인증 관련 타입들
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

export interface AuthState {
  user: User | null
  isLoading: boolean
}
