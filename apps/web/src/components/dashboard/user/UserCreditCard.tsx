'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getCreditBalance, getCreditTransactions } from '@/lib/credits';
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Plus,
  History,
  DollarSign
} from 'lucide-react';

interface UserCreditCardProps {
  credits: number;
}

export function UserCreditCard({ credits }: UserCreditCardProps) {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);

  // 크레딧 잔액 및 거래 내역 로드
  const { data: creditBalanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['creditBalance'],
    queryFn: getCreditBalance,
    refetchInterval: 60000, // 1분마다 갱신
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['creditTransactions', { limit: 10 }],
    queryFn: () => getCreditTransactions({ limit: 10 }),
  });

  const recentTransactions = transactionsData?.data || [];

  // 최근 30일 사용량 계산
  const getLast30DaysUsage = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return recentTransactions
      .filter(t => t.type === 'USAGE' && new Date(t.createdAt) >= thirtyDaysAgo)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  // 평균 일일 사용량
  const getDailyAverageUsage = () => {
    const usage = getLast30DaysUsage();
    return Math.round(usage / 30);
  };

  // 예상 소진 날짜
  const getEstimatedDepletionDays = () => {
    const dailyAvg = getDailyAverageUsage();
    if (dailyAvg === 0) return null;
    return Math.floor(credits / dailyAvg);
  };

  // 크레딧 레벨에 따른 색상 (블루 계열)
  const getCreditColor = () => {
    if (credits < 100) return 'text-red-600';
    if (credits < 500) return 'text-orange-600';
    if (credits < 1000) return 'text-blue-500';
    return 'text-blue-600';
  };

  const getCreditBgColor = () => {
    if (credits < 100) return 'bg-red-500';
    if (credits < 500) return 'bg-orange-500';
    if (credits < 1000) return 'bg-blue-400';
    return 'bg-blue-600';
  };

  if (balanceLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="animate-pulse">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            <div className="ml-3 h-6 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-24 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  const last30DaysUsage = getLast30DaysUsage();
  const dailyAverage = getDailyAverageUsage();
  const depletionDays = getEstimatedDepletionDays();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <CreditCard className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 ml-3">크레딧 보유량</h3>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-gray-400 hover:text-gray-600"
        >
          <TrendingUp className="w-5 h-5" />
        </button>
      </div>

      {/* 기본 정보 */}
      <div className="space-y-3">
        <div>
          <p className="text-gray-600 text-sm mb-1">현재 보유량</p>
          <p className={`text-2xl font-bold ${getCreditColor()}`}>
            {credits?.toLocaleString() || 0} 크레딧
          </p>
          {depletionDays !== null && depletionDays < 30 && (
            <p className="text-xs text-orange-600 flex items-center mt-1">
              <AlertTriangle className="w-3 h-3 mr-1" />
              약 {depletionDays}일 후 소진 예상
            </p>
          )}
        </div>

        {/* 사용량 표시 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">크레딧 레벨</span>
            <span className={`text-xs font-medium ${getCreditColor()}`}>
              {credits >= 1000 ? '우수' : credits >= 500 ? '양호' : credits >= 100 ? '보통' : '부족'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getCreditBgColor()}`}
              style={{ width: `${Math.min((credits / 1000) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* 최근 사용량 */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>30일 사용량: {last30DaysUsage.toLocaleString()}</span>
          <span className="flex items-center">
            <TrendingDown className="w-3 h-3 mr-1" />
            일평균 {dailyAverage}
          </span>
        </div>
      </div>

      {/* 메인 액션 버튼 */}
      <div className="mt-4">
        <button
          onClick={() => router.push('/credits')}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          크레딧 충전
        </button>
      </div>

      {/* 상세 정보 */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">30일 총 사용</p>
              <p className="font-medium text-red-600">-{last30DaysUsage.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-600">일평균 사용</p>
              <p className="font-medium">{dailyAverage.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-600">총 거래</p>
              <p className="font-medium">{recentTransactions.length}건</p>
            </div>
            <div>
              <p className="text-gray-600">예상 잔여일</p>
              <p className="font-medium">
                {depletionDays ? `${depletionDays}일` : '무한'}
              </p>
            </div>
          </div>

          {/* 최근 거래 내역 미리보기 */}
          {!transactionsLoading && recentTransactions.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600 flex items-center">
                  <History className="w-3 h-3 mr-1" />
                  최근 거래
                </span>
                <button
                  onClick={() => router.push('/credits')}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  전체보기
                </button>
              </div>
              <div className="space-y-1">
                {recentTransactions.slice(0, 3).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded"
                  >
                    <span className="text-gray-600">
                      {transaction.type === 'PURCHASE' ? '충전' :
                       transaction.type === 'USAGE' ? '사용' :
                       transaction.type === 'REFUND' ? '환불' : '보너스'}
                    </span>
                    <span className={`font-medium ${
                      transaction.type === 'USAGE' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {transaction.type === 'USAGE' ? '-' : '+'}
                      {Math.abs(transaction.amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 빠른 충전 버튼 */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => router.push('/credits?amount=1000')}
              className="flex-1 px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              <DollarSign className="w-3 h-3 inline mr-1" />
              1,000
            </button>
            <button
              onClick={() => router.push('/credits?amount=5000')}
              className="flex-1 px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              <DollarSign className="w-3 h-3 inline mr-1" />
              5,000
            </button>
            <button
              onClick={() => router.push('/credits?amount=10000')}
              className="flex-1 px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              <DollarSign className="w-3 h-3 inline mr-1" />
              10,000
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
