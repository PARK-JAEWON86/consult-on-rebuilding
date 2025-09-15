import { api } from '@/lib/api';

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