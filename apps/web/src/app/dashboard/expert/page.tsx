'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { api } from '@/lib/api';
import { LayoutDashboard } from 'lucide-react';

interface ExpertStats {
  totalConsultations: number;
  completedConsultations: number;
  pendingConsultations: number;
  totalEarnings: number;
  averageRating: number;
  totalClients: number;
  thisMonthEarnings: number;
  attendanceRate: number;
  newClients: number;
}

interface TodayScheduleItem {
  id: number;
  displayId: string;
  time: string;
  endTime: string;
  duration: number;
  status: string;
  clientName: string;
  clientEmail?: string;
  consultationType: string;
  price: number;
}

export default function ExpertDashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [stats, setStats] = useState<ExpertStats | null>(null);
  const [schedule, setSchedule] = useState<TodayScheduleItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      loadExpertData();
    }
  }, [user]);

  async function loadExpertData() {
    try {
      setIsLoadingData(true);
      const [statsResponse, scheduleResponse] = await Promise.all([
        api.get<{ success: boolean; data: ExpertStats }>('/experts/stats'),
        api.get<{ success: boolean; data: TodayScheduleItem[] }>('/experts/schedule/today'),
      ]);

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

      if (scheduleResponse.data.success) {
        setSchedule(scheduleResponse.data.data);
      }
    } catch (error) {
      console.error('Failed to load expert data:', error);
    } finally {
      setIsLoadingData(false);
    }
  }

  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  const getConsultationTypeLabel = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return '비디오 상담';
      case 'VOICE':
        return '음성 상담';
      case 'TEXT':
        return '텍스트 상담';
      default:
        return type;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-10 py-10 space-y-6">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-blue-900">
            환영합니다, {user.name} 전문가님!
          </h1>
        </div>
        <p className="text-blue-700 mt-1">
          전문가 대시보드에서 상담 일정과 수익을 관리하세요
        </p>
      </div>

      {/* 통계 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 오늘의 상담 */}
        <div className="bg-white rounded-lg border border-blue-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">오늘의 상담</p>
              <p className="text-2xl font-bold text-blue-900">{schedule.length}건</p>
            </div>
          </div>
        </div>

        {/* 대기 중인 예약 */}
        <div className="bg-white rounded-lg border border-orange-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">대기 중인 예약</p>
              <p className="text-2xl font-bold text-orange-900">{stats?.pendingConsultations || 0}건</p>
            </div>
          </div>
        </div>

        {/* 이번 달 수익 */}
        <div className="bg-white rounded-lg border border-green-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">이번 달 수익</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(stats?.thisMonthEarnings || 0)}</p>
            </div>
          </div>
        </div>

        {/* 평균 평점 */}
        <div className="bg-white rounded-lg border border-purple-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">평균 평점</p>
              <p className="text-2xl font-bold text-purple-900">{stats?.averageRating || 0}/5.0</p>
            </div>
          </div>
        </div>
      </div>

      {/* 주요 기능 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 예약 요청 관리 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 ml-3">예약 요청 관리</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            새로운 상담 예약 요청을 확인하고 승인하세요
          </p>
          <button
            onClick={() => router.push('/dashboard/expert/reservation-requests' as any)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            예약 요청 보기
          </button>
        </div>

        {/* 상담 세션 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 ml-3">상담 세션</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            진행 중인 상담 세션을 관리하고 참여하세요
          </p>
          <button
            onClick={() => router.push('/dashboard/expert/consultation-sessions' as any)}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            세션 관리
          </button>
        </div>

        {/* 상담 내역 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 ml-3">상담 내역</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            완료된 상담 내역과 고객 피드백을 확인하세요
          </p>
          <button
            onClick={() => router.push('/dashboard/expert/consultations' as any)}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            내역 보기
          </button>
        </div>
      </div>

      {/* 오늘의 일정 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">오늘의 상담 일정</h3>
          <button
            onClick={() => router.push('/dashboard/expert/consultation-sessions' as any)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            전체 일정 보기
          </button>
        </div>
        {schedule.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            오늘 예정된 상담이 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {schedule.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
              >
                <div>
                  <p className="font-medium text-gray-900">{item.clientName} - {getConsultationTypeLabel(item.consultationType)}</p>
                  <p className="text-sm text-gray-600">{item.duration}분 상담</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-600">
                    {formatTime(item.time)} - {formatTime(item.endTime)}
                  </p>
                  <p className="text-xs text-gray-500">{formatCurrency(item.price)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 퀵 액션 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">빠른 액션</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => router.push('/dashboard/expert/profile' as any)}
            className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 border border-blue-200 transition-colors"
          >
            프로필 수정
          </button>
          <button
            onClick={() => router.push('/dashboard/expert/reviews' as any)}
            className="px-4 py-2 bg-white text-green-600 rounded-md hover:bg-green-50 border border-green-200 transition-colors"
          >
            리뷰 관리
          </button>
          <button
            onClick={() => router.push('/dashboard/expert/payouts' as any)}
            className="px-4 py-2 bg-white text-purple-600 rounded-md hover:bg-purple-50 border border-purple-200 transition-colors"
          >
            정산/출금
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-white text-orange-600 rounded-md hover:bg-orange-50 border border-orange-200 transition-colors"
          >
            사용자 대시보드
          </button>
        </div>
      </div>
    </div>
  );
}
