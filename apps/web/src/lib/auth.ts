import { api } from '@/lib/api';

export interface Expert {
  id: number;
  displayId: string;
  hourlyRate: number;
  name: string;
  title?: string;
  specialty?: string;
  bio?: string;
  avatarUrl?: string;
  ratingAvg: number;
  reviewCount: number;
  isActive: boolean;
  level: string;
  responseTime: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  roles: ('USER' | 'EXPERT' | 'ADMIN')[];
  createdAt?: string;
  updatedAt?: string;
  credits?: number;
  avatarUrl?: string;
  isEmailVerified?: boolean;
  emailVerifiedAt?: string;
  expert?: Expert;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
}

export async function register(payload: { email: string; password: string; name: string }) {
  const r = await api.post('/auth/register', payload);
  return r.data;
}

export async function resendVerification(email: string) {
  const r = await api.post('/auth/resend-verification', { email });
  return r.data;
}

export async function verifyEmailByToken(token: string) {
  const r = await api.get('/auth/verify-email', { params: { token } });
  return r.data;
}