'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMe } from '@/hooks/useMe';
import { useRoleStore } from '@/store/role';
import { DashboardUserView } from '@/components/dashboard/user/DashboardUserView';
import { DashboardExpertView } from '@/components/dashboard/expert/DashboardExpertView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const RoleSwitcher = () => {
  const { data: user } = useMe();
  const { roleView, setRoleView } = useRoleStore();

  if (!user) return null;

  const hasExpertRole = user.roles.includes('EXPERT');

  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setRoleView('user')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            roleView === 'user'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          사용자 뷰
        </button>
        <button
          onClick={() => setRoleView('expert')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            roleView === 'expert'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          전문가 뷰
          {!hasExpertRole && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-orange-100 text-orange-600 rounded">
              신청필요
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

const ExpertApplicationCTA = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">👨‍💼</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">전문가로 활동하기</h2>
          <p className="text-gray-600">
            전문 지식을 공유하고 수익을 창출해보세요. 전문가 승인을 받으면 상담 서비스를 제공할 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl">📝</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">신청서 작성</h3>
            <p className="text-sm text-gray-600">전문 분야와 경력을 작성해주세요</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl">🔍</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">심사 진행</h3>
            <p className="text-sm text-gray-600">2-3일 내에 심사 결과를 알려드려요</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl">🚀</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">활동 시작</h3>
            <p className="text-sm text-gray-600">승인 후 바로 상담 서비스 시작</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" className="px-8">
            전문가 신청하기
          </Button>
          <Button variant="outline" size="lg" className="px-8">
            자세히 알아보기
          </Button>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>전문가 혜택:</strong> 시간당 3만원~10만원 수익, 유연한 스케줄 관리, 전문 지식 공유를 통한 성취감
          </p>
        </div>
      </Card>
    </div>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const { data: user, isLoading, error } = useMe();
  const { roleView } = useRoleStore();

  useEffect(() => {
    if (!isLoading && (error || !user)) {
      router.push('/auth/login');
    }
  }, [user, isLoading, error, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return null; // Will redirect to login
  }

  const hasExpertRole = user.roles.includes('EXPERT');
  const showExpertView = roleView === 'expert' && hasExpertRole;
  const showExpertCTA = roleView === 'expert' && !hasExpertRole;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RoleSwitcher />
        
        {roleView === 'user' && <DashboardUserView />}
        {showExpertView && <DashboardExpertView />}
        {showExpertCTA && <ExpertApplicationCTA />}
      </div>
    </div>
  );
}
