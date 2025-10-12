'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

/**
 * 전문가 프로필 편집 페이지
 * /dashboard/expert/profile로 리다이렉트하고 편집 모드를 활성화합니다.
 */
export default function ExpertProfileEditPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user || !user.roles.includes('EXPERT')) {
        // 전문가가 아니면 로그인 페이지로
        router.push('/auth/login?redirect=/dashboard/expert/profile/edit');
      } else {
        // 전문가면 프로필 페이지로 리다이렉트하고 편집 모드 활성화
        router.push('/dashboard/expert/profile?mode=edit');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">프로필 편집 페이지로 이동 중...</p>
      </div>
    </div>
  );
}
