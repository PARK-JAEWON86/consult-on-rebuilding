'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/components/auth/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { getUpcomingReservations, getMyReservations, type Reservation } from '@/lib/reservations';
import { getCreditBalance, getCreditTransactions } from '@/lib/credits';
import { reservationsToActivities, creditTransactionsToActivities, mergeActivities } from '@/lib/activity';
import { UserCreditCard } from '@/components/dashboard/user/UserCreditCard';
import { ReservationsCalendar } from '@/components/dashboard/user/ReservationsCalendar';
import { CardSkeleton } from '@/components/ui/Skeleton';

// 동적 임포트로 초기 번들 크기 감소
const AIUsageCard = dynamic(
  () => import('@/components/dashboard/user/AIUsageCard').then(mod => ({ default: mod.AIUsageCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);

const RecentActivity = dynamic(
  () => import('@/components/dashboard/user/RecentActivity').then(mod => ({ default: mod.RecentActivity })),
  { loading: () => <CardSkeleton />, ssr: false }
);

const CreditBalance = dynamic(
  () => import('@/components/dashboard/user/CreditBalance').then(mod => ({ default: mod.CreditBalance })),
  { loading: () => <CardSkeleton />, ssr: false }
);

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // 예약 데이터 로드
  const { data: upcomingData, isLoading: upcomingLoading } = useQuery({
    queryKey: ['upcomingReservations'],
    queryFn: getUpcomingReservations,
    enabled: !!user,
    refetchInterval: 60000, // 1분마다 갱신
  });

  // 전체 예약 데이터 로드 (활동용)
  const { data: allReservationsData } = useQuery({
    queryKey: ['allReservations'],
    queryFn: () => getMyReservations({ limit: 10 }),
    enabled: !!user,
    refetchInterval: 60000,
  });

  // 크레딧 잔액 로드
  const { data: creditBalanceData, isLoading: creditBalanceLoading } = useQuery({
    queryKey: ['creditBalance'],
    queryFn: getCreditBalance,
    enabled: !!user,
    refetchInterval: 30000,
  });

  // 크레딧 거래 내역 로드
  const { data: creditTransactionsData } = useQuery({
    queryKey: ['creditTransactions'],
    queryFn: () => getCreditTransactions({ limit: 10 }),
    enabled: !!user,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  // 활동 데이터 병합 (메모이제이션)
  const activities = useMemo(() => {
    const reservationActivities = reservationsToActivities(allReservationsData?.data || []);
    const creditActivities = creditTransactionsToActivities(creditTransactionsData?.data || []);
    return mergeActivities(reservationActivities, creditActivities).slice(0, 10);
  }, [allReservationsData, creditTransactionsData]);

  // 이벤트 핸들러 최적화
  const handleReservationClick = useCallback((reservation: Reservation) => {
    router.push(`/dashboard/consultations/${reservation.id}` as any);
  }, [router]);

  const handleViewAllActivities = useCallback(() => {
    router.push('/dashboard/activity' as any);
  }, [router]);

  const handlePurchaseCredits = useCallback(() => {
    router.push('/credits');
  }, [router]);

  const handleViewHistory = useCallback(() => {
    router.push('/dashboard/credits/history' as any);
  }, [router]);

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

  if (!user) {
    return null; // Will redirect to login
  }

  const upcomingReservations = upcomingData?.data || [];
  const creditBalance = creditBalanceData?.data;
  const recentTransactions = creditTransactionsData?.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          환영합니다, {user.name}님!
        </h1>
        <p className="text-gray-600">
          상담 예약과 크레딧을 관리하세요
        </p>
      </div>

      {/* 상단: 크레딧, AI 토큰, 최근 활동 가로 배치 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* 크레딧 잔액 */}
        {creditBalance && !creditBalanceLoading ? (
          <CreditBalance
            balance={creditBalance}
            recentTransactions={recentTransactions.slice(0, 3)}
            onPurchaseCredits={handlePurchaseCredits}
            onViewHistory={handleViewHistory}
          />
        ) : (
          <UserCreditCard credits={user.credits || 0} />
        )}

        {/* AI 채팅 토큰 */}
        <AIUsageCard />

        {/* 최근 활동 */}
        <RecentActivity
          activities={activities}
          onViewAll={handleViewAllActivities}
          isLoading={!allReservationsData && !creditTransactionsData}
        />
      </div>

      {/* 메인 콘텐츠 */}
      <div className="space-y-6">
        {/* 예약 달력 섹션 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">예약 일정</h3>
            <button
              onClick={() => router.push('/dashboard/reservations')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
            >
              전체 보기
            </button>
          </div>

          <ReservationsCalendar
            reservations={upcomingReservations}
            onReservationClick={handleReservationClick}
            isLoading={upcomingLoading}
          />

          {!upcomingLoading && upcomingReservations.length === 0 && (
            <div className="text-gray-500 text-center py-8 mt-4">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mb-2">아직 예약이 없습니다.</p>
              <button
                onClick={() => router.push('/experts')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
              >
                전문가 찾기 →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
