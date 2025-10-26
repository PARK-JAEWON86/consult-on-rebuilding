'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import CreditsClient from './CreditsClient';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function CreditsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // 인증 확인
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // 현재 페이지 경로를 redirect 파라미터로 전달
      const currentPath = encodeURIComponent('/credits');
      router.push(`/auth/login?redirect=${currentPath}`);
    }
  }, [isAuthenticated, isLoading, router]);

  // 로딩 중이거나 인증되지 않은 경우
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isLoading ? "로딩 중..." : "로그인 페이지로 이동 중..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <CreditsClient />
    </DashboardLayout>
  );
}