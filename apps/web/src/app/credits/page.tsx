import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth-server';
import CreditsClient from './CreditsClient';

export default async function CreditsPage() {
  // 서버 사이드에서 인증 확인
  const user = await requireAuth();

  return <CreditsClient user={user} />;
}