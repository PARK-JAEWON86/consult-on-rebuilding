"use client";

import { useState, useEffect } from "react";
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ClientStatsCard } from './ClientStatsCard';
import { MyReservations } from './MyReservations';
import { CreditBalance } from './CreditBalance';
import { RecentActivity } from './RecentActivity';
import { QuickActions } from './QuickActions';
import {
  Calendar,
  RefreshCw,
  CreditCard,
  UserCheck,
  Star,
  TrendingUp,
  Clock
} from "lucide-react";
import { getMyReservations, getUpcomingReservations } from '@/lib/reservations';
import { getCreditBalance, getCreditTransactions } from '@/lib/credits';
import { Reservation } from '@/lib/reservations';
import { CreditBalance as CreditBalanceType, CreditTransaction } from '@/lib/credits';

interface ClientStats {
  totalConsultations: number;
  completedConsultations: number;
  upcomingConsultations: number;
  totalSpent: number;
  averageRating: number;
  favoriteExperts: number;
  thisMonthConsultations: number;
  creditBalance: number;
}

interface ActivityItem {
  id: string;
  type: 'consultation_completed' | 'consultation_scheduled' | 'credit_purchased' | 'review_written' | 'reservation_cancelled';
  title: string;
  description: string;
  timestamp: string;
  expertName?: string;
  reservationId?: number;
  credits?: number;
  rating?: number;
}

export const DashboardUserView = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [clientStats, setClientStats] = useState<ClientStats>({
    totalConsultations: 0,
    completedConsultations: 0,
    upcomingConsultations: 0,
    totalSpent: 0,
    averageRating: 0,
    favoriteExperts: 0,
    thisMonthConsultations: 0,
    creditBalance: 0
  });
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [creditBalance, setCreditBalance] = useState<CreditBalanceType>({
    balance: 0,
    totalUsed: 0,
    totalPurchased: 0
  });
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);

  // 데이터 로드
  useEffect(() => {
    const loadClientData = async () => {
      setIsLoading(true);
      try {
        // 병렬로 데이터 로드
        const [reservationsResponse, creditBalanceResponse, creditTransactionsResponse] = await Promise.all([
          getMyReservations({ limit: 20 }),
          getCreditBalance(),
          getCreditTransactions({ limit: 10 })
        ]);

        if (reservationsResponse.success) {
          setReservations(reservationsResponse.data || []);
          
          // 통계 계산
          const completed = reservationsResponse.data?.filter(r => r.status === 'COMPLETED').length || 0;
          const upcoming = reservationsResponse.data?.filter(r => r.status === 'SCHEDULED').length || 0;
          const totalSpent = reservationsResponse.data?.reduce((sum, r) => sum + r.price, 0) || 0;
          
          setClientStats({
            totalConsultations: reservationsResponse.data?.length || 0,
            completedConsultations: completed,
            upcomingConsultations: upcoming,
            totalSpent,
            averageRating: 4.8, // 실제로는 리뷰에서 계산
            favoriteExperts: 3, // 실제로는 데이터에서 계산
            thisMonthConsultations: 5,
            creditBalance: creditBalance.balance
          });
        }

        if (creditBalanceResponse.success) {
          setCreditBalance(creditBalanceResponse.data);
        }

        if (creditTransactionsResponse.success) {
          setCreditTransactions(creditTransactionsResponse.data || []);
          
          // 활동 내역 생성
          const activities: ActivityItem[] = [
            {
              id: '1',
              type: 'consultation_completed',
              title: '상담 완료',
              description: '김전문가와의 진로상담이 완료되었습니다',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              expertName: '김전문가',
              rating: 5
            },
            {
              id: '2',
              type: 'credit_purchased',
              title: '크레딧 충전',
              description: '1,000 크레딧을 구매했습니다',
              timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              credits: 1000
            },
            {
              id: '3',
              type: 'consultation_scheduled',
              title: '상담 예약',
              description: '박전문가와의 심리상담을 예약했습니다',
              timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              expertName: '박전문가'
            }
          ];
          setRecentActivities(activities);
        }
      } catch (error) {
        console.error('클라이언트 데이터 로드 실패:', error);
        // 더미 데이터 설정
        setClientStats({
          totalConsultations: 12,
          completedConsultations: 8,
          upcomingConsultations: 2,
          totalSpent: 240000,
          averageRating: 4.8,
          favoriteExperts: 3,
          thisMonthConsultations: 3,
          creditBalance: 1250
        });
        setReservations([
          {
            id: 1,
            displayId: 'res_001',
            userId: 1,
            expertId: 1,
            expertName: '김진로전문가',
            startAt: '2024-01-15T14:00:00Z',
            endAt: '2024-01-15T15:00:00Z',
            status: 'SCHEDULED',
            specialty: '진로상담',
            type: 'VIDEO',
            price: 30000,
            createdAt: '2024-01-10T10:00:00Z'
          },
          {
            id: 2,
            displayId: 'res_002',
            userId: 1,
            expertId: 2,
            expertName: '박심리전문가',
            startAt: '2024-01-20T16:00:00Z',
            endAt: '2024-01-20T16:45:00Z',
            status: 'SCHEDULED',
            specialty: '심리상담',
            type: 'CHAT',
            price: 25000,
            createdAt: '2024-01-12T14:30:00Z'
          }
        ]);
        setCreditBalance({
          balance: 1250,
          totalUsed: 750,
          totalPurchased: 2000,
          expiresAt: '2024-02-15T00:00:00Z'
        });
        setCreditTransactions([
          {
            id: 1,
            displayId: 'txn_001',
            type: 'USAGE',
            amount: 30000,
            description: '김진로전문가 상담',
            createdAt: '2024-01-10T10:00:00Z',
            reservationId: 1,
            expertName: '김진로전문가'
          },
          {
            id: 2,
            displayId: 'txn_002',
            type: 'PURCHASE',
            amount: 100000,
            description: '크레딧 충전',
            createdAt: '2024-01-08T15:30:00Z'
          }
        ]);
        setRecentActivities([
          {
            id: '1',
            type: 'consultation_completed',
            title: '상담 완료',
            description: '김진로전문가와의 진로상담이 완료되었습니다',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            expertName: '김진로전문가',
            rating: 5
          },
          {
            id: '2',
            type: 'credit_purchased',
            title: '크레딧 충전',
            description: '100,000 크레딧을 구매했습니다',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            credits: 100000
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadClientData();
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleBookConsultation = () => {
    console.log('상담 예약하기');
    // 실제로는 상담 예약 페이지로 이동
  };

  const handlePurchaseCredits = () => {
    console.log('크레딧 충전하기');
    // 실제로는 크레딧 충전 페이지로 이동
  };

  const handleFindExpert = () => {
    console.log('전문가 찾기');
    // 실제로는 전문가 목록 페이지로 이동
  };

  const handleViewReviews = () => {
    console.log('리뷰 보기');
    // 실제로는 리뷰 페이지로 이동
  };

  const handleSettings = () => {
    console.log('설정');
    // 실제로는 설정 페이지로 이동
  };

  const handleHelp = () => {
    console.log('도움말');
    // 실제로는 도움말 페이지로 이동
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">대시보드를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                나의 상담 대시보드
              </h1>
              <p className="text-gray-600 mt-1">
                상담 예약과 크레딧을 관리하세요
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>새로고침</span>
              </Button>
            </div>
          </div>
        </div>

        {/* 통계 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <ClientStatsCard
            title="크레딧 잔액"
            value={`${creditBalance.balance.toLocaleString()}`}
            icon={<CreditCard className="h-6 w-6" />}
            subtitle="사용 가능"
            color="blue"
          />
          
          <ClientStatsCard
            title="예정된 상담"
            value={`${clientStats.upcomingConsultations}건`}
            icon={<Calendar className="h-6 w-6" />}
            subtitle={`총 ${clientStats.totalConsultations}건`}
            color="green"
          />
          
          <ClientStatsCard
            title="완료된 상담"
            value={`${clientStats.completedConsultations}건`}
            icon={<UserCheck className="h-6 w-6" />}
            subtitle={`이번 달 ${clientStats.thisMonthConsultations}건`}
            color="purple"
          />
          
          <ClientStatsCard
            title="총 사용 금액"
            value={`₩${clientStats.totalSpent.toLocaleString()}`}
            icon={<TrendingUp className="h-6 w-6" />}
            subtitle="상담 비용"
            color="yellow"
          />
        </div>

        {/* 메인 콘텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 상담 예약 */}
          <div className="lg:col-span-2">
            <MyReservations
              reservations={reservations}
              onReservationClick={(reservation) => {
                console.log('예약 상세보기:', reservation);
              }}
              onBookNew={handleBookConsultation}
            />
          </div>

          {/* 오른쪽: 사이드바 */}
          <div className="space-y-6">
            <CreditBalance
              balance={creditBalance}
              recentTransactions={creditTransactions}
              onPurchaseCredits={handlePurchaseCredits}
              onViewHistory={() => {
                console.log('크레딧 내역 보기');
              }}
            />

            <RecentActivity
              activities={recentActivities}
              onViewAll={() => {
                console.log('모든 활동 보기');
              }}
            />
          </div>
        </div>

        {/* 빠른 액션 */}
        <div className="mt-8">
          <QuickActions
            onBookConsultation={handleBookConsultation}
            onPurchaseCredits={handlePurchaseCredits}
            onFindExpert={handleFindExpert}
            onViewReviews={handleViewReviews}
            onSettings={handleSettings}
            onHelp={handleHelp}
          />
        </div>
      </div>
    </div>
  );
};
